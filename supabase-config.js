// Supabase Configuration
// Replace these with your actual Supabase project credentials
// Get them from: https://app.supabase.com -> Your Project -> Settings -> API

const SUPABASE_URL = 'https://hinhffcnbjxorlrahtxc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_udoEfz4UmZnSAR_tIGv_Cg_wvrS6Jdp';

// Initialize Supabase client
// When using CDN, supabase is available as a global variable
// Ensure supabase is loaded before initializing
(function() {
    let retryCount = 0;
    const maxRetries = 100; // 5 seconds max wait (100 * 50ms)
    
    function initSupabaseClient() {
        retryCount++;
        
        if (typeof supabase !== 'undefined' && supabase && typeof supabase.createClient === 'function') {
            try {
                const { createClient } = supabase;
                const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                
                // Verify the client has the expected methods
                if (client && typeof client.from === 'function') {
                    window.supabaseClient = client;
                    console.log('Supabase client initialized successfully');
                    // Dispatch event to notify that supabaseClient is ready
                    window.dispatchEvent(new Event('supabaseReady'));
                } else {
                    console.error('Supabase client created but missing .from() method');
                    if (retryCount < maxRetries) {
                        setTimeout(initSupabaseClient, 50);
                    }
                }
            } catch (error) {
                console.error('Error creating Supabase client:', error);
                if (retryCount < maxRetries) {
                    setTimeout(initSupabaseClient, 50);
                }
            }
        } else {
            if (retryCount < maxRetries) {
                // Retry after a short delay if supabase isn't loaded yet
                setTimeout(initSupabaseClient, 50);
            } else {
                console.error('Supabase library failed to load after', maxRetries, 'retries');
            }
        }
    }
    
    // Start initialization immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupabaseClient);
    } else {
        initSupabaseClient();
    }
})();

