import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zusoswmjnhjrdyxjyspn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1c29zd21qbmhqcmR5eGp5c3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTk0NzQsImV4cCI6MjA4NzU3NTQ3NH0.6VYksNOwl7FT_4TN-jcV9xrBCTfbV6irvqehAquKHBE'

export const supabase = createClient(supabaseUrl, supabaseKey)