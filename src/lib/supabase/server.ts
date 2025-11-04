import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function createClient() {
  const supabase = createServerComponentClient({ cookies })
  return supabase
}