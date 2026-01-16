import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  email: string
  name: string
  bedtime: string
  wake_time: string
  created_at: string
}

export type SleepLog = {
  id: string
  user_id: string
  date: string
  went_to_bed_on_time: boolean
  actual_bedtime: string | null
}

export type CircleMember = {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted'
  created_at: string
  friend?: User
  streak?: number
}
