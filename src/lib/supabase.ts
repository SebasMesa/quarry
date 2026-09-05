import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gaxycuafkjnwxpdyzdfi.supabase.co';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheHljdWFma2pud3hwZHl6ZGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTg5NTgsImV4cCI6MjEwMjAzNDk1OH0.-DQFVcIZVAychCJT5gMRCe8iTcJc1RZAXBrWX06t4H0';

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
