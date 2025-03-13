import { createBrowserClient } from '@supabase/ssr'
import type { AuthError, AuthResponse, User, Session } from '@supabase/supabase-js'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = "edge"

// Add timeout wrapper with a default timeout of 10 seconds
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
};

// Generic type for Supabase responses
type SupabaseResponse<T> = {
  data: T | null;
  error: AuthError | null;
}

// Wrap Supabase calls with timeout and error handling
const wrapSupabaseCall = async <T>(
  operation: () => Promise<SupabaseResponse<T>>,
  timeoutMs?: number
): Promise<SupabaseResponse<T>> => {
  try {
    const result = await withTimeout(operation(), timeoutMs);
    return result;
  } catch (error: any) {
    return {
      data: null,
      error: { 
        message: error.message || 'Operation failed',
        name: 'TimeoutError',
        status: 408
      } as AuthError
    };
  }
};

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email);
}

export async function getSession(): Promise<SupabaseResponse<{ session: Session | null }>> {
  return wrapSupabaseCall(async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data: { session: data.session }, error };
  });
}

export async function getUser(): Promise<SupabaseResponse<{ user: User | null }>> {
  return wrapSupabaseCall(async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data: { user: data.user }, error };
  });
}

// Add function to get user profile with role
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase.rpc('get_user_role_and_profile', { 
    user_id: userId 
  });
  return { data, error };
} 