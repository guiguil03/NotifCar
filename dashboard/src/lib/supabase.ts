import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lifmyjdygwakmimjgkef.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZm15amR5Z3dha21pbWpna2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzQ5NzAsImV4cCI6MjA3MjUxMDk3MH0.o9msOeNxdpq4zQNwX2D9W_OjJw-7gsOFB8H7q3Lla8g'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)