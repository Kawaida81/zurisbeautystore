# Supabase Edge Functions

This directory contains Edge Functions for optimizing authentication and user profile management.

## Functions Overview

### 1. Fast Auth (`fast-auth`)
Provides a streamlined authentication process by combining user authentication and profile retrieval in a single request.

### 2. Session Validator (`validate-session`)
Quick session validation with role checking, designed for protecting routes and verifying user permissions.

### 3. Profile Cache (`profile-cache`)
Implements an in-memory cache for user profiles to reduce database load and improve response times.

### 4. Rate Limiter (`rate-limit`)
Manages failed login attempts and implements rate limiting to protect against brute force attacks.

## Deployment

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link to your Supabase project:
```bash
supabase link --project-ref your-project-ref
```

3. Deploy all functions:
```bash
supabase functions deploy fast-auth
supabase functions deploy validate-session
supabase functions deploy profile-cache
supabase functions deploy rate-limit
```

## Environment Variables

Each function requires the following environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Usage

### Fast Auth
```typescript
const { data, error } = await supabase.functions.invoke('fast-auth', {
  body: { email, password }
})
```

### Session Validator
```typescript
const { data, error } = await supabase.functions.invoke('validate-session', {
  body: { user_id }
})
```

### Profile Cache
```typescript
const { data, error } = await supabase.functions.invoke('profile-cache', {
  body: { user_id }
})
```

### Rate Limiter
```typescript
const { data, error } = await supabase.functions.invoke('rate-limit', {
  body: { email, ip_address }
})
``` 