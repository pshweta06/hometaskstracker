// Supabase Configuration
// Replace these with your actual Supabase project credentials
// Get them from: https://app.supabase.com -> Your Project -> Settings -> API

const SUPABASE_URL = 'https://hinhffcnbjxorlrahtxc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_udoEfz4UmZnSAR_tIGv_Cg_wvrS6Jdp';

// Initialize Supabase client
(function initializeSupabaseClient() {
    function tryInitialize() {
        // Check if Supabase library is loaded
        if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
            try {
                const { createClient } = supabase;
                const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

                // Verify the client has the expected methods
                console.log('Created Supabase client:', client);
                console.log('Client methods:', {
                    hasFrom: typeof client?.from === 'function',
                    hasAuth: typeof client?.auth === 'object',
                    clientType: typeof client,
                    clientKeys: client ? Object.keys(client) : 'no client'
                });

                if (client && typeof client.from === 'function' && typeof client.auth === 'object') {
                    window.supabaseClient = client;
                    console.log('✅ Supabase client initialized successfully');
                    // Dispatch event to notify that supabaseClient is ready
                    window.dispatchEvent(new Event('supabaseReady'));
                    return true;
                } else {
                    console.error('❌ Supabase client created but missing required methods:', {
                        hasFrom: typeof client?.from === 'function',
                        hasAuth: typeof client?.auth === 'object',
                        client: !!client
                    });
                    return false;
                }
            } catch (error) {
                console.error('❌ Error creating Supabase client:', error);
                return false;
            }
        } else {
            console.log('⏳ Supabase library not yet loaded, waiting...');
            return false;
        }
    }

    // Try immediately (in case script loaded synchronously)
    if (tryInitialize()) {
        return;
    }

    // If not ready, wait for DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Try again after DOM is ready
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max wait
            const interval = setInterval(() => {
                attempts++;
                if (tryInitialize() || attempts >= maxAttempts) {
                    clearInterval(interval);
                    if (attempts >= maxAttempts) {
                        console.error('❌ Failed to initialize Supabase client after waiting');
                    }
                }
            }, 100);
        });
    } else {
        // DOM already loaded, try with retries
        let attempts = 0;
        const maxAttempts = 50;
        const interval = setInterval(() => {
            attempts++;
            if (tryInitialize() || attempts >= maxAttempts) {
                clearInterval(interval);
                if (attempts >= maxAttempts) {
                    console.error('❌ Failed to initialize Supabase client after waiting');
                }
            }
        }, 100);
    }
})();

