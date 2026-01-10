// Supabase Configuration
// Replace these with your actual Supabase project credentials
// Get them from: https://app.supabase.com -> Your Project -> Settings -> API

const SUPABASE_URL = 'https://hinhffcnbjxorlrahtxc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_udoEfz4UmZnSAR_tIGv_Cg_wvrS6Jdp';

// Initialize Supabase client synchronously
(function initializeSupabaseClient() {
    // Wait for the supabaseLoaded promise from the HTML script
    window.supabaseLoaded.then((supabaseLib) => {
        if (supabaseLib && typeof supabaseLib.createClient === 'function') {
            try {
                const { createClient } = supabaseLib;
                const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

                // Verify the client has the expected methods
                console.log('Created client:', client);
                console.log('Client methods:', {
                    hasFrom: typeof client?.from === 'function',
                    hasAuth: typeof client?.auth === 'object',
                    clientType: typeof client,
                    clientKeys: client ? Object.keys(client) : 'no client'
                });

                if (client && typeof client.from === 'function' && typeof client.auth === 'object') {
                    window.supabaseClient = client;
                    console.log('Supabase client initialized successfully');
                    // Dispatch event to notify that supabaseClient is ready
                    window.dispatchEvent(new Event('supabaseReady'));
                } else {
                    console.error('Supabase client created but missing required methods:', {
                        hasFrom: typeof client?.from === 'function',
                        hasAuth: typeof client?.auth === 'object',
                        client: !!client
                    });
                }
            } catch (error) {
                console.error('Error creating Supabase client:', error);
            }
        } else {
            console.error('Supabase library not available or missing createClient method');
        }
    }).catch((error) => {
        console.error('Failed to load Supabase library:', error);
    });
})();

