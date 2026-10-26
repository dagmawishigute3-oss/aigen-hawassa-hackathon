import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://epghwveyqoofabiqqrf.supabase.co'
const supabaseAnonKey = 'sb_publishable_cuydPJVkMiQEkx-t4WMsjA_xe-qWk3q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)