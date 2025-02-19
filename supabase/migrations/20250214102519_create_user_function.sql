-- Enable the pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- Create an enum type for roles if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'worker', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS sync_user_role ON public.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS get_user_role(uuid);
DROP FUNCTION IF EXISTS create_new_user(uuid, text, text, text, text);
DROP FUNCTION IF EXISTS update_user_role(uuid, text);
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS sync_user_role_to_auth();

-- Function to create new user in public.users when auth user is created
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    true,
    now(),
    now()
  );
  return new;
end;
$$;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- Function to get user role
create or replace function get_user_role(user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
begin
  select role into user_role
  from public.users
  where id = user_id;
  
  return user_role;
end;
$$;

-- Function to update user role
create or replace function update_user_role(
  target_user_id uuid,
  new_role text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  -- Validate role
  if new_role not in ('admin', 'worker', 'client') then
    raise exception 'Invalid role specified';
  end if;

  -- Update public.users role
  update public.users
  set role = new_role,
      updated_at = now()
  where id = target_user_id
  returning json_build_object(
    'id', id,
    'email', email,
    'role', role
  ) into result;

  return result;
end;
$$;

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all routines in schema public to anon, authenticated;

-- Enable RLS
alter table public.users enable row level security;

-- Drop ALL existing policies
drop policy if exists "Users can view their own profile" on public.users;
drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists "Enable insert for service role" on public.users;
drop policy if exists "Admins can view all profiles" on public.users;
drop policy if exists "Enable read access to own user profile" on public.users;
drop policy if exists "Enable update access to own user profile" on public.users;
drop policy if exists "Enable insert access for service role only" on public.users;
drop policy if exists "Enable insert access for new users" on public.users;
drop policy if exists "Allow public read access during auth" on public.users;

-- Create new policies
create policy "users_read_policy"
  on public.users for select
  using (true);

create policy "users_update_policy"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users_insert_policy"
  on public.users for insert
  with check (true);

-- Update the raw user metadata when role changes
create or replace function sync_user_role_to_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and NEW.role != OLD.role then
    -- Update the raw_user_meta_data in auth.users
    update auth.users
    set raw_user_meta_data = 
      coalesce(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', NEW.role)
    where id = NEW.id;
  end if;
  return NEW;
end;
$$;

-- Create the trigger for role changes
drop trigger if exists sync_user_role on public.users;
create trigger sync_user_role
  after update on public.users
  for each row execute function sync_user_role_to_auth(); 