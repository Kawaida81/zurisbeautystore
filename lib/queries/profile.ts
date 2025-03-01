import { createClient } from '@/lib/supabase/client'
import type { Database, Json } from '@/lib/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileResponse = Database['public']['Functions']['get_client_profile']['Returns']

// Get client profile
export async function getClientProfile(): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get profile data using the database function
    const { data, error } = await supabase
      .rpc('get_client_profile', {
        p_client_id: user.id
      })
      .single()

    if (error) {
      throw error
    }

    // Initialize default values for required fields if they're null
    const profile: Profile = {
      id: user.id,
      date_of_birth: (data as ProfileResponse)?.date_of_birth ?? null,
      gender: (data as ProfileResponse)?.gender ?? null,
      preferred_contact: (data as ProfileResponse)?.preferred_contact ?? 'email',
      emergency_contact_name: (data as ProfileResponse)?.emergency_contact_name ?? null,
      emergency_contact_phone: (data as ProfileResponse)?.emergency_contact_phone ?? null,
      allergies: (data as ProfileResponse)?.allergies ?? null,
      medical_conditions: (data as ProfileResponse)?.medical_conditions ?? null,
      skin_concerns: (data as ProfileResponse)?.skin_concerns ?? null,
      hair_type: (data as ProfileResponse)?.hair_type ?? null,
      preferred_worker_id: (data as ProfileResponse)?.preferred_worker_id ?? null,
      preferences: (data as ProfileResponse)?.preferences ?? {},
      last_visit_date: (data as ProfileResponse)?.last_visit_date ?? null,
      total_visits: (data as ProfileResponse)?.total_visits ?? 0,
      total_spent: (data as ProfileResponse)?.total_spent ?? 0,
      loyalty_points: (data as ProfileResponse)?.loyalty_points ?? 0,
      address: (data as ProfileResponse)?.address ?? null,
      avatar_url: (data as ProfileResponse)?.avatar_url ?? null,
      created_at: (data as ProfileResponse)?.created_at ?? new Date().toISOString(),
      updated_at: (data as ProfileResponse)?.updated_at ?? new Date().toISOString()
    }

    return { data: profile, error: null }
  } catch (error) {
    console.error('Error fetching client profile:', error)
    return { data: null, error: error as Error }
  }
}

// Update client profile
export async function updateClientProfile(
  profileData: Partial<Profile>
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Update profile data
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...profileData,
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw error
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating client profile:', error)
    return { success: false, error: error as Error }
  }
}

// Get profile avatar URL
export async function getProfileAvatarUrl(path: string): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  } catch (error) {
    console.error('Error getting avatar URL:', error)
    return null
  }
}

// Upload profile avatar
export async function uploadProfileAvatar(
  file: File
): Promise<{ path: string | null; error: Error | null }> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Upload file
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      throw uploadError
    }

    // Update profile with new avatar URL
    await updateClientProfile({ avatar_url: filePath })

    return { path: filePath, error: null }
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return { path: null, error: error as Error }
  }
} 