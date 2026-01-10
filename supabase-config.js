// Supabase Configuration
// Replace these with your actual Supabase project credentials
// Get them from: https://app.supabase.com -> Your Project -> Settings -> API

const SUPABASE_URL = 'https://hinhffcnbjxorlrahtxc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_udoEfz4UmZnSAR_tIGv_Cg_wvrS6Jdp';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

