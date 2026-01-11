// App State
console.log('app.js loaded and executing');
let currentUser = null;
let tasks = [];
let lastToggledId = null;

// Supabase client (will be initialized by supabase-config.js)
let supabaseClient;

const DEFAULT_CSV_DATA = `Task ID,Room,Task,Frequency,Last Completed,,,Notes
1,Living + Dining,General Dusting,Weekly,2026-01-02,,,
2,Living + Dining,Vacuum sofa,Weekly,2026-01-02,,,
3,Living + Dining,Clean play mat,Weekly,2026-01-02,,,
4,Living + Dining,Spot-clean walls & fingerprints,Monthly,2026-01-02,,,
5,Living + Dining,Organise toys (living room and kids bedroom),Weekly,2026-01-02,,,
6,Living + Dining,Wipe windows & grilles (inside),Monthly,2026-01-02,,,
7,Living + Dining,Clean ceiling fans,Monthly,2026-01-02,,,
8,Living + Dining,Vacuum under sofa,Monthly,2026-01-02,,,
9,Living + Dining,Polish table,Monthly,2026-01-02,,,
10,Living + Dining,Refresh dehumidifers,Quarterly,2026-01-02,,,
11,Living + Dining,Air out shoes,Monthly,2026-01-02,,,
12,Living + Dining,Vacuum sofa,Weekly,2026-01-02,,,
13,Living + Dining,Replace cushion covers,Monthly,2026-01-02,,,
14,Living + Dining,Change doormat,Monthly,2026-01-02,,,
15,Living + Dining,Sweep the entrance,Weekly,2026-01-02,,,
16,Living + Dining,Vacuum curtains,Quarterly,2026-01-02,,,
17,Living + Dining,Replace ant bait,Quarterly,2026-01-02,,,
18,Kitchen,Wipe cabinet doors & handles,Weekly,2026-01-02,,,
19,Kitchen,"Wipe appliances: fridge, oven, kettle, rice cooker, blender, microwave etc",Weekly,2026-01-02,,,
20,Kitchen,Wash dish rack & sponge holder,Weekly,2026-01-02,,,
21,Kitchen,Replace kitchen cleaning cloth,Monthly,2026-01-02,,,
22,Kitchen,Clean fridge,Monthly,2026-01-02,,,
23,Kitchen,Deep-clean dishwasher,Monthly,2026-01-02,,,
24,Kitchen,"Deep-clean sink: clean strainer, drain cover, put Mr.Muscle",Weekly,2026-01-02,,,
25,Kitchen,Deep clean vessel holder and bottle dryer,Monthly,2026-01-02,,,
26,Kitchen,Deep clean stove hood filters & backsplash,Monthly,2026-01-02,,,
27,Kitchen,Declutter snacks cupboard,Weekly,2026-01-02,,,
28,Kitchen,Organise food pantry and remove expired food,Monthly,2026-01-02,,,
29,Kitchen,Deep clean stove and backsplash,Weekly,2026-01-02,,,
29,Yard,"Deep-clean sink: clean strainer, drain cover, put Mr.Muscle",Monthly,2026-01-02,,,
30,Yard,Wipe washing machine exterior,Weekly,2026-01-02,,,
31,Yard,Clean washer/dryer lint filter and water collector,Weekly,2026-01-02,,,
32,Yard,Deep clean washing machine,Quarterly,2026-01-02,,,
33,Yard,Clean sink pipe trap,Quarterly,2026-01-02,,,
34,Yard,Wash/ replace mop heads,Monthly,2026-01-02,,,
35,Yard,Wash broom and dustpan,Monthly,2026-01-02,,,
36,Yard,Clean vacuum dust holder,Monthly,2026-01-02,,,
37,Yard,Declutter yard area,Quarterly,2026-01-02,,,
38,Bathroom,Descale shower head & taps,Quarterly,2026-01-02,,,
39,Bathroom,Clean common bathroom,Weekly,2026-01-02,,,
40,Bathroom,Clean master bathroom,Weekly,2026-01-02,,,
41,Bathroom,Declutter toilettries area,Monthly,2026-01-02,,,
42,Bedrooms,Dust surfaces (bedside tables),Monthly,2026-01-02,,,
43,Bedrooms,Change bedsheets,Weekly,2026-01-02,,,
44,Bedrooms,Vacuum mattress,Weekly,2026-01-02,,,
45,Bedrooms,Wipe and declutter desk,Weekly,2026-01-02,,,
46,Bedrooms,Vacuum under desk and chair,Monthly,2026-01-02,,,
47,Bedrooms,Wash pillow protectors / mattress protector,Quarterly,2026-01-02,,,
48,Bedrooms,Vacuum under/behind bed,Quarterly,2026-01-02,,,
49,Bedrooms,Wipe down wardrobe doors,Quarterly,2026-01-02,,,
50,Bedrooms,Vacuum under bed / behind storage boxes,Monthly,2026-01-02,,,
51,Bedrooms,Separate outgrown kids clothes; bag donations,Quarterly,2026-01-02,,,
52,Living + Dining,"Remove trash from strollers, wipe down",Weekly,2026-01-02,,,
53,Whole House,Clean trash bins (rinse & dry),Monthly,2026-01-02,,,
54,Bedrooms,Wash and replace kids sleeping bag sheets from school,Weekly,2026-01-02,,,`;

// DOM Elements
const views = {
    login: document.getElementById('login-view'),
    signup: document.getElementById('signup-view'),
    forgotPassword: document.getElementById('forgot-password-view'),
    resetPassword: document.getElementById('reset-password-view'),
    acceptInvite: document.getElementById('accept-invite-view'),
    userDashboard: document.getElementById('user-dashboard'),
    adminPanel: document.getElementById('admin-panel')
};

// Store tokens temporarily (don't set session until password is set)
let pendingRecoveryToken = null;
let pendingInviteToken = null;

// Helper function to convert database snake_case to camelCase
function dbToJs(dbTask) {
    return {
        id: dbTask.id,
        room: dbTask.room,
        task: dbTask.task,
        frequency: dbTask.frequency,
        lastCompleted: dbTask.last_completed,
        nextDue: dbTask.next_due,
        completedThisCycle: dbTask.completed_this_cycle
    };
}

// Helper function to convert JS camelCase to database snake_case
function jsToDb(jsTask) {
    return {
        room: jsTask.room,
        task: jsTask.task,
        frequency: jsTask.frequency,
        last_completed: jsTask.lastCompleted || null,
        next_due: jsTask.nextDue,
        completed_this_cycle: jsTask.completedThisCycle || false
    };
}

// --- Supabase Database Operations ---

async function loadTasks() {
    try {
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        tasks = data.map(dbToJs);
        return tasks;
    } catch (error) {
        console.error('Error loading tasks:', error);
        return [];
    }
}

async function saveTask(task) {
    try {
        const dbTask = jsToDb(task);
        
        if (task.id) {
            // Update existing task
            const { data, error } = await supabaseClient
                .from('tasks')
                .update(dbTask)
                .eq('id', task.id)
                .select()
                .single();

            if (error) throw error;
            return dbToJs(data);
    } else {
            // Insert new task
            const { data, error } = await supabaseClient
                .from('tasks')
                .insert(dbTask)
                .select()
                .single();

            if (error) throw error;
            return dbToJs(data);
        }
    } catch (error) {
        console.error('Error saving task:', error);
        throw error;
    }
}

async function deleteTaskFromDb(taskId) {
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
}

async function bulkInsertTasks(taskArray) {
    try {
        const dbTasks = taskArray.map(jsToDb);
        const { data, error } = await supabaseClient
            .from('tasks')
            .insert(dbTasks)
            .select();

        if (error) throw error;
        return data.map(dbToJs);
    } catch (error) {
        console.error('Error bulk inserting tasks:', error);
        throw error;
    }
}

async function deleteAllTasks() {
    try {
        const { error } = await supabaseClient
            .from('tasks')
            .delete()
            .neq('id', 0); // Delete all tasks

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting all tasks:', error);
        throw error;
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM loaded, checking Supabase...');

        // Try to initialize Supabase client if not already done
        if (!window.supabaseClient) {
            console.log('No supabaseClient found, trying manual initialization...');
            if (typeof supabase !== 'undefined' && supabase.createClient) {
                const { createClient } = supabase;
                window.supabaseClient = createClient(
                    'https://hinhffcnbjxorlrahtxc.supabase.co',
                    'sb_publishable_udoEfz4UmZnSAR_tIGv_Cg_wvrS6Jdp'
                );
                console.log('Manual Supabase client initialization successful');
            }
        }

        // Check if we have a working Supabase client
        if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
            console.log('Supabase client ready, initializing app...');
            supabaseClient = window.supabaseClient;
            initApp();
        } else {
            console.warn('Supabase client not available, but continuing with app initialization...');
            // Continue without Supabase for now - show login form anyway
            supabaseClient = null;
            initApp();
        }

    } catch (error) {
        console.error('Failed to initialize app:', error);
        // Still try to show the app even if Supabase fails
        supabaseClient = null;
        try {
            initApp();
        } catch (initError) {
            console.error('Failed to initialize app even without Supabase:', initError);
        }
    }
});

async function initApp() {
    setupEventListeners();
    
    // Listen for hash changes (in case hash is added after page load)
    window.addEventListener('hashchange', () => {
        checkSession();
    });
    
    // Listen for Supabase client ready event
    window.addEventListener('supabaseReady', () => {
        console.log('Supabase ready event received');
        if (window.supabaseClient && !supabaseClient) {
            supabaseClient = window.supabaseClient;
            // Re-check session in case we're on password reset page
            checkSession();
        }
    });
    
    await checkSession();
}

async function loadData() {
    const loadedTasks = await loadTasks();
    
    if (loadedTasks.length === 0) {
        // First run: Import default data
        await importCSV(DEFAULT_CSV_DATA);
    } else {
        tasks = loadedTasks;
    }
}

async function checkSession() {
    try {
        // Check for password reset hash in URL FIRST (before any Supabase calls)
        const hash = window.location.hash.substring(1);
        console.log('Checking hash:', hash);
        if (hash) {
            try {
                const hashParams = new URLSearchParams(hash);
                const accessToken = hashParams.get('access_token');
                const type = hashParams.get('type');
                
                console.log('Hash params - type:', type, 'access_token:', accessToken ? 'present' : 'missing');
                
                if (type === 'recovery' && accessToken) {
                    // User clicked password reset link from email
                    console.log('Password reset detected - showing reset form (NOT logging in)');
                    
                    // Store the token but DON'T set session - user needs to set password first
                    pendingRecoveryToken = {
                        access_token: accessToken,
                        refresh_token: hashParams.get('refresh_token') || ''
                    };
                    
                    showView('resetPassword');
                    // Clear the hash from URL
                    window.history.replaceState(null, null, window.location.pathname);
                    return;
                }
                
                if ((type === 'invite' || type === 'signup') && accessToken) {
                    // User clicked invite link from email
                    console.log('Invite detected - showing account creation form (NOT logging in)');
                    
                    // Store the token but DON'T set session - user needs to create account first
                    pendingInviteToken = {
                        access_token: accessToken,
                        refresh_token: hashParams.get('refresh_token') || ''
                    };
                    
                    showView('acceptInvite');
                    // Clear the hash from URL
                    window.history.replaceState(null, null, window.location.pathname);
                    return;
                }
            } catch (error) {
                console.error('Error parsing hash:', error);
            }
        }

        // If no Supabase client, just show login
        if (!supabaseClient && !window.supabaseClient) {
            showView('login');
            return;
        }
        
        // Ensure supabaseClient is set
        if (!supabaseClient && window.supabaseClient) {
            supabaseClient = window.supabaseClient;
        }

        // Don't auto-login if we have pending recovery or invite tokens
        // (user needs to complete password reset or account creation first)
        if (pendingRecoveryToken || pendingInviteToken) {
            console.log('Pending token detected, skipping auto-login');
            return;
        }

        // Check if user is already logged in
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            // Get user profile with role
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('username, role')
                .eq('id', session.user.id)
                .single();

            if (error) throw error;

            currentUser = {
                id: session.user.id,
                username: profile.username,
                role: profile.role
            };

            await loadData();
        showView(currentUser.role === 'admin' ? 'adminPanel' : 'userDashboard');
        updateUI();
    } else {
            showView('login');
        }
    } catch (error) {
        console.error('Error checking session:', error);
        showView('login');
    }
}

// --- Routing/View Management ---
function showView(viewName) {
    console.log("Showing view:", viewName);
    Object.keys(views).forEach(key => {
        if (views[key]) {
            views[key].classList.toggle('hidden', key !== viewName);
        } else {
            console.warn("View not found for key:", key);
        }
    });
}

// --- Auth Logic ---
function setupEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Sign Up
    document.getElementById('signup-form')?.addEventListener('submit', handleSignup);

    // Auth Toggles
    document.getElementById('show-signup')?.addEventListener('click', (e) => {
        e.preventDefault();
        showView('signup');
    });
    document.getElementById('show-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        showView('login');
    });
    document.getElementById('show-forgot-password')?.addEventListener('click', (e) => {
        e.preventDefault();
        showView('forgotPassword');
    });
    document.getElementById('show-login-from-forgot')?.addEventListener('click', (e) => {
        e.preventDefault();
        showView('login');
    });

    // Password Reset
    document.getElementById('forgot-password-form')?.addEventListener('submit', handleForgotPassword);
    document.getElementById('reset-password-form')?.addEventListener('submit', handleResetPassword);
    
    // Accept Invite
    document.getElementById('accept-invite-form')?.addEventListener('submit', handleAcceptInvite);

    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Navigation
    document.getElementById('go-to-admin')?.addEventListener('click', () => showView('adminPanel'));
    document.getElementById('back-to-dashboard')?.addEventListener('click', () => showView('userDashboard'));

    // Admin Actions
    document.getElementById('add-task-btn')?.addEventListener('click', openAddTaskModal);
    document.getElementById('import-csv-btn')?.addEventListener('click', async () => {
        if (confirm("This will reset all your tasks and progress. Continue?")) {
            await importCSV(DEFAULT_CSV_DATA);
            await loadData();
            updateUI();
        }
    });
    document.getElementById('close-modal')?.addEventListener('click', closeModal);
    document.getElementById('task-form')?.addEventListener('submit', handleSaveTask);
    
    // User Actions
    document.getElementById('toggle-preview')?.addEventListener('click', togglePreview);
}

async function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('username').value.toLowerCase().trim();
    const passwordInput = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = "";

    console.log('🔐 Login attempt - checking supabaseClient...');
    console.log('supabaseClient:', supabaseClient);
    console.log('typeof supabaseClient:', typeof supabaseClient);
    console.log('window.supabaseClient exists:', !!window.supabaseClient);
    console.log('window.supabaseClient.from:', typeof window.supabaseClient?.from);

    try {
        // Check if supabaseClient is initialized, wait if needed
        if (!supabaseClient) {
            if (window.supabaseClient) {
                console.log('✅ window.supabaseClient exists, using it as fallback');
                supabaseClient = window.supabaseClient;
            } else {
                // Wait for Supabase client to be initialized
                console.log('⏳ Waiting for Supabase client to initialize...');
                let attempts = 0;
                while (!window.supabaseClient && attempts < 30) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                if (window.supabaseClient) {
                    supabaseClient = window.supabaseClient;
                    console.log('✅ Supabase client initialized after waiting');
                } else {
                    throw new Error('Supabase client not initialized. Please refresh the page.');
                }
            }
        }

        // Verify client has required methods
        if (!supabaseClient || typeof supabaseClient.from !== 'function' || typeof supabaseClient.auth !== 'object') {
            console.error('❌ supabaseClient details:', {
                type: typeof supabaseClient,
                keys: supabaseClient ? Object.keys(supabaseClient) : 'null',
                from: typeof supabaseClient?.from,
                auth: typeof supabaseClient?.auth
            });
            throw new Error('Supabase client is not properly initialized. Please refresh the page.');
        }

        console.log('✅ supabaseClient ready for login');
        
        // Use email directly (no @hometasks.local format)
        const email = usernameInput;
        
        console.log('Attempting login with email:', email);
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: passwordInput
        });

        if (error) throw error;

        // Get user profile
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('username, role')
            .eq('id', data.user.id)
            .single();

        if (profileError) throw profileError;

        currentUser = {
            id: data.user.id,
            username: profile.username,
            role: profile.role
        };

        await loadData();
        showView(currentUser.role === 'admin' ? 'adminPanel' : 'userDashboard');
        updateUI();
    } catch (error) {
        console.error('Login error:', error);
        errorEl.textContent = error.message || "Invalid email or password";
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value.toLowerCase().trim();
    const username = document.getElementById('signup-username').value.toLowerCase().trim();
    const password = document.getElementById('signup-password').value;
    const errorEl = document.getElementById('signup-error');
    errorEl.textContent = "";

    try {
        // Validate email format
        if (!email.includes('@') || !email.includes('.')) {
            errorEl.textContent = "Please enter a valid email address";
            return;
        }

        // Ensure Supabase client is initialized
        if (!supabaseClient) {
            if (window.supabaseClient) {
                supabaseClient = window.supabaseClient;
            } else {
                // Wait for Supabase client to be initialized
                let attempts = 0;
                while (!window.supabaseClient && attempts < 30) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                if (window.supabaseClient) {
                    supabaseClient = window.supabaseClient;
                } else {
                    throw new Error('Supabase client not initialized. Please refresh the page.');
                }
            }
        }

        // Verify client has required methods
        if (!supabaseClient || typeof supabaseClient.from !== 'function' || typeof supabaseClient.auth !== 'object') {
            throw new Error('Supabase client is not properly initialized. Please refresh the page.');
        }

        // Check if username already exists
        const { data: existingProfile } = await supabaseClient
            .from('profiles')
            .select('username')
            .eq('username', username)
            .single();

        if (existingProfile) {
            errorEl.textContent = "Username already exists";
            return;
        }

        // Create user with real email address
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    role: 'user'
                }
            }
        });

        if (error) throw error;

        // Profile should be created automatically by trigger, but let's verify and ensure username is correct
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('username, role')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            // If profile doesn't exist, create it manually
            const { error: insertError } = await supabaseClient
                .from('profiles')
                .insert({
                    id: data.user.id,
                    username: username,
                    role: 'user'
                });

            if (insertError) {
                console.error('Profile insert error:', insertError);
                throw insertError;
            }
        } else if (profile && profile.username !== username) {
            // Update username if it doesn't match (trigger might have extracted wrong username)
            console.log(`Updating username from '${profile.username}' to '${username}'`);
            const { error: updateError } = await supabaseClient
                .from('profiles')
                .update({ username: username })
                .eq('id', data.user.id);

            if (updateError) {
                console.error('Username update error:', updateError);
                // Continue anyway - at least profile exists
            }
        }

        currentUser = {
            id: data.user.id,
            username: username,
            role: 'user'
        };

        await loadData();
    showView('userDashboard');
    updateUI();
    } catch (error) {
        console.error('Signup error:', error);
        errorEl.textContent = error.message || "Error creating account";
    }
}

async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
    currentUser = null;
        tasks = [];
    showView('login');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('forgot-username').value.toLowerCase().trim();
    const errorEl = document.getElementById('forgot-password-error');
    const successEl = document.getElementById('forgot-password-success');
    errorEl.textContent = "";
    successEl.textContent = "";

    try {
        if (!supabaseClient) {
            if (window.supabaseClient) {
                supabaseClient = window.supabaseClient;
            } else {
                throw new Error('Supabase client not initialized.');
            }
        }

        // Use email directly (no @hometasks.local format)
        const email = usernameInput;
        
        // Validate email format
        if (!email.includes('@') || !email.includes('.')) {
            errorEl.textContent = "Please enter a valid email address";
            return;
        }
        
        // Get the current URL to use as redirect URL
        const redirectUrl = window.location.origin + window.location.pathname;
        
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
        });

        if (error) throw error;

        successEl.textContent = "Password reset email sent! Check your email for the reset link.";
        document.getElementById('forgot-password-form').reset();
    } catch (error) {
        console.error('Forgot password error:', error);
        errorEl.textContent = error.message || "Error sending reset email. Please check your username.";
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorEl = document.getElementById('reset-password-error');
    const successEl = document.getElementById('reset-password-success');
    errorEl.textContent = "";
    successEl.textContent = "";

    if (newPassword !== confirmPassword) {
        errorEl.textContent = "Passwords do not match.";
        return;
    }

    if (newPassword.length < 6) {
        errorEl.textContent = "Password must be at least 6 characters.";
        return;
    }

    try {
        // Ensure Supabase client is initialized
        if (!supabaseClient) {
            if (window.supabaseClient) {
                supabaseClient = window.supabaseClient;
            } else {
                // Wait a bit for client to initialize
                let attempts = 0;
                while (!window.supabaseClient && attempts < 20) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                if (window.supabaseClient) {
                    supabaseClient = window.supabaseClient;
                } else {
                    throw new Error('Supabase client not initialized. Please refresh the page.');
                }
            }
        }

        // Verify client has auth method
        if (!supabaseClient || !supabaseClient.auth) {
            throw new Error('Supabase client not properly initialized. Please refresh the page.');
        }

        // If we have a stored recovery token, set the session first
        if (pendingRecoveryToken) {
            console.log('Setting session with recovery token before password update');
            const { error: sessionError } = await supabaseClient.auth.setSession({
                access_token: pendingRecoveryToken.access_token,
                refresh_token: pendingRecoveryToken.refresh_token
            });
            
            if (sessionError) {
                throw new Error('Invalid or expired reset link. Please request a new one.');
            }
            
            // Clear the stored token
            pendingRecoveryToken = null;
        }

        // Update the password
        const { data: updateData, error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) {
            console.error('Password update error details:', error);
            throw error;
        }

        console.log('Password update response:', updateData);

        // Verify the update worked by checking the session
        const { data: { session: verifySession } } = await supabaseClient.auth.getSession();
        if (!verifySession) {
            console.error('Session lost after password update');
            throw new Error('Password update may have failed. Please try again.');
        }

        console.log('Password updated successfully, session verified');

        successEl.textContent = "Password updated successfully! Redirecting to login...";
        setTimeout(() => {
            // Sign out to force re-login with new password
            supabaseClient.auth.signOut();
            pendingRecoveryToken = null; // Clear token
            showView('login');
            document.getElementById('reset-password-form').reset();
        }, 2000);
    } catch (error) {
        console.error('Reset password error:', error);
        errorEl.textContent = error.message || "Error updating password. The reset link may have expired.";
    }
}

async function handleAcceptInvite(e) {
    e.preventDefault();
    const username = document.getElementById('invite-username').value.toLowerCase().trim();
    const password = document.getElementById('invite-password').value;
    const confirmPassword = document.getElementById('invite-confirm-password').value;
    const errorEl = document.getElementById('accept-invite-error');
    const successEl = document.getElementById('accept-invite-success');
    errorEl.textContent = "";
    successEl.textContent = "";

    if (password !== confirmPassword) {
        errorEl.textContent = "Passwords do not match.";
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = "Password must be at least 6 characters.";
        return;
    }

    if (!pendingInviteToken) {
        errorEl.textContent = "Invalid invite link. Please request a new invitation.";
        return;
    }

    try {
        // Ensure Supabase client is initialized
        if (!supabaseClient) {
            if (window.supabaseClient) {
                supabaseClient = window.supabaseClient;
            } else {
                let attempts = 0;
                while (!window.supabaseClient && attempts < 20) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                if (window.supabaseClient) {
                    supabaseClient = window.supabaseClient;
                } else {
                    throw new Error('Supabase client not initialized. Please refresh the page.');
                }
            }
        }

        if (!supabaseClient || !supabaseClient.auth) {
            throw new Error('Supabase client not properly initialized. Please refresh the page.');
        }

        // Set session with invite token
        console.log('Setting session with invite token');
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.setSession({
            access_token: pendingInviteToken.access_token,
            refresh_token: pendingInviteToken.refresh_token
        });

        if (sessionError) {
            throw new Error('Invalid or expired invite link. Please request a new invitation.');
        }

        // Check if username already exists
        const { data: existingProfile } = await supabaseClient
            .from('profiles')
            .select('username')
            .eq('username', username)
            .single();

        if (existingProfile) {
            errorEl.textContent = "Username already exists. Please choose a different username.";
            return;
        }

        // Update password
        const { error: passwordError } = await supabaseClient.auth.updateUser({
            password: password
        });

        if (passwordError) throw passwordError;

        // Keep the original email (from invite) - don't change it
        // Users will log in with their real email address
        const currentEmail = sessionData.user.email;
        console.log('User email remains:', currentEmail);

        // Update or create profile with username
        const userId = sessionData.user.id;
        
        // First try to get existing profile
        const { data: currentProfile } = await supabaseClient
            .from('profiles')
            .select('username, role')
            .eq('id', userId)
            .single();

        if (currentProfile) {
            // Update existing profile
            const { error: updateError } = await supabaseClient
                .from('profiles')
                .update({ username: username, role: 'user' })
                .eq('id', userId);
            
            if (updateError) {
                console.error('Profile update error:', updateError);
                throw updateError;
            }
        } else {
            // Insert new profile
            const { error: insertError } = await supabaseClient
                .from('profiles')
                .insert({
                    id: userId,
                    username: username,
                    role: 'user'
                });
            
            if (insertError) {
                console.error('Profile insert error:', insertError);
                throw insertError;
            }
        }

        // Clear the stored token
        pendingInviteToken = null;

        // Get user profile
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('username, role')
            .eq('id', userId)
            .single();

        currentUser = {
            id: userId,
            username: profile?.username || username,
            role: profile?.role || 'user'
        };

        successEl.textContent = "Account created successfully! Redirecting...";
        setTimeout(async () => {
            await loadData();
            showView(currentUser.role === 'admin' ? 'adminPanel' : 'userDashboard');
            updateUI();
        }, 1500);
    } catch (error) {
        console.error('Accept invite error:', error);
        errorEl.textContent = error.message || "Error creating account. The invite link may have expired.";
    }
}

// --- UI Updates ---
function updateUI() {
    if (!currentUser) return;

    document.getElementById('display-name').textContent = `Hello, ${currentUser.username}`;
    document.getElementById('admin-link-container').classList.toggle('hidden', currentUser.role !== 'admin');

    if (currentUser.role === 'admin') {
        renderAdminTable();
    }
    
    renderUserDashboard();
}

function renderUserDashboard() {
    const today = new Date();
    const startOfWeek = getStartOfWeek(today);
    const endOfWeek = getEndOfWeek(today);
    const startOfNextWeek = new Date(startOfWeek);
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
    const endOfNextWeek = new Date(endOfWeek);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);

    // Reset completion status for tasks that were completed in a PREVIOUS week
    tasks.forEach(t => {
        if (t.completedThisCycle && t.lastCompleted) {
            const lastComp = new Date(t.lastCompleted);
            if (lastComp < startOfWeek) {
                t.completedThisCycle = false;
            }
        }
    });

    // Delayed: nextDue is in the past AND it wasn't completed this week
    const delayedTasks = tasks.filter(t => {
        const due = new Date(t.nextDue);
        const wasDoneThisWeek = t.completedThisCycle && t.lastCompleted && new Date(t.lastCompleted) >= startOfWeek;
        
        if (wasDoneThisWeek) return false;
        return due < startOfWeek;
    });

    // Current: nextDue is this week OR it was completed this week
    const currentTasks = tasks.filter(t => {
        const due = new Date(t.nextDue);
        const wasDoneThisWeek = t.completedThisCycle && t.lastCompleted && new Date(t.lastCompleted) >= startOfWeek;
        
        if (wasDoneThisWeek) return true;
        return due >= startOfWeek && due <= endOfWeek;
    });

    const previewTasks = tasks.filter(t => {
        const due = new Date(t.nextDue);
        return due > endOfWeek && due <= endOfNextWeek;
    }).map(t => ({...t, completedThisCycle: false}));

    renderTaskList('delayed-tasks-list', delayedTasks, true);
    renderTaskList('current-tasks-list', currentTasks, false);
    renderTaskList('preview-tasks-list', previewTasks, false);

    const delayedContainer = document.getElementById('delayed-tasks-container');
    if (delayedContainer) {
        delayedContainer.classList.toggle('hidden', delayedTasks.length === 0);
        const h2 = delayedContainer.querySelector('h2');
        if (h2) h2.innerHTML = `<span>⚠️</span> Delayed Tasks`;
    }
    
    updateProgressBar(currentTasks, delayedTasks);
}

function renderTaskList(elementId, taskList, isDelayed) {
    const container = document.getElementById(elementId);
    if (!container) return;

    if (taskList.length === 0) {
        container.innerHTML = `<li class="task-item no-tasks">No tasks in this category</li>`;
        return;
    }

    // Sort: Uncompleted first, then Completed. 
    // Within those: Frequency (Weekly > Monthly > Quarterly), then Room, then Task name.
    const freqPriority = { 'Weekly': 1, 'Monthly': 2, 'Quarterly': 3 };
    
    const sorted = [...taskList].sort((a, b) => {
        if (a.completedThisCycle !== b.completedThisCycle) {
            return a.completedThisCycle ? 1 : -1;
        }
        if (a.frequency !== b.frequency) {
            return (freqPriority[a.frequency] || 99) - (freqPriority[b.frequency] || 99);
        }
        if (a.room !== b.room) {
            return a.room.localeCompare(b.room);
        }
        return a.task.localeCompare(b.task);
    });

    // Group by Room
    const groups = {};
    sorted.forEach(t => {
        if (!groups[t.room]) groups[t.room] = [];
        groups[t.room].push(t);
    });

    let html = '';
    for (const room in groups) {
        html += `<div class="room-group">
            <h3 class="room-title">${room}</h3>
            <ul class="room-task-list">
                ${groups[room].map(t => {
                    const isJustToggled = t.id === lastToggledId;
                    const animClass = isJustToggled ? (t.completedThisCycle ? 'anim-move-down' : 'anim-move-up') : '';
                    
                    return `
                        <li class="task-item ${t.completedThisCycle ? 'task-done' : ''} ${animClass}">
                            <input type="checkbox" ${t.completedThisCycle ? 'checked' : ''} onchange="handleToggleTask(${t.id})">
                            <div class="task-info">
                                <div class="task-name ${t.completedThisCycle ? 'completed' : ''}">${t.task}</div>
                                <div class="task-meta">
                                    ${t.frequency}
                                    ${isDelayed ? '<span class="tag tag-delayed">Delayed</span>' : ''}
                                </div>
                            </div>
                        </li>
                    `;
                }).join('')}
            </ul>
        </div>`;
    }

    container.innerHTML = html;
}

function updateProgressBar(current, delayed) {
    const total = current.length + delayed.length;
    if (total === 0) {
        document.getElementById('progress-fill').style.width = "100%";
        return;
    }

    const completed = [...current, ...delayed].filter(t => t.completedThisCycle).length;
    const percentage = Math.round((completed / total) * 100);
    document.getElementById('progress-fill').style.width = `${percentage}%`;
}

function renderAdminTable() {
    const tableBody = document.getElementById('admin-task-table-body');
    if (!tableBody) return;

    const freqPriority = { 'Weekly': 1, 'Monthly': 2, 'Quarterly': 3 };
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.room !== b.room) return a.room.localeCompare(b.room);
        if (a.frequency !== b.frequency) return (freqPriority[a.frequency] || 99) - (freqPriority[b.frequency] || 99);
        return a.task.localeCompare(b.task);
    });

    tableBody.innerHTML = sortedTasks.map(t => `
        <tr>
            <td>${t.room}</td>
            <td>${t.task}</td>
            <td><span class="tag tag-freq">${t.frequency}</span></td>
            <td>${t.nextDue}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editTask(${t.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteTask(${t.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function populateRoomDropdown() {
    const roomSelect = document.getElementById('task-room');
    if (!roomSelect) return;

    // Get unique rooms from current tasks
    const rooms = [...new Set(tasks.map(t => t.room))].sort();
    
    roomSelect.innerHTML = rooms.map(room => 
        `<option value="${room}">${room}</option>`
    ).join('');
}

function openAddTaskModal() {
    document.getElementById('modal-title').textContent = "Add New Task";
    document.getElementById('task-form').reset();
    populateRoomDropdown();
    document.getElementById('edit-task-id').value = "";
    document.getElementById('task-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('task-modal').classList.add('hidden');
}

async function handleSaveTask(e) {
    e.preventDefault();
    const id = document.getElementById('edit-task-id').value;
    const room = document.getElementById('task-room').value;
    const taskName = document.getElementById('task-desc').value;
    const freq = document.getElementById('task-freq').value;

    try {
        let task;
    if (id) {
            // Update existing task
            task = tasks.find(t => t.id == id);
        if (task) {
            task.room = room;
            task.task = taskName;
            task.frequency = freq;
                await saveTask(task);
        }
    } else {
            // Create new task
            task = {
                id: null,
            room: room,
            task: taskName,
            frequency: freq,
            lastCompleted: null,
            nextDue: new Date().toISOString().split('T')[0],
            completedThisCycle: false
        };
            const savedTask = await saveTask(task);
            tasks.push(savedTask);
    }

        await loadData();
    updateUI();
    closeModal();
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Error saving task. Please try again.');
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    document.getElementById('modal-title').textContent = "Edit Task";
    document.getElementById('edit-task-id').value = task.id;
    populateRoomDropdown();
    document.getElementById('task-room').value = task.room;
    document.getElementById('task-desc').value = task.task;
    document.getElementById('task-freq').value = task.frequency;
    
    document.getElementById('task-modal').classList.remove('hidden');
}

async function deleteTask(id) {
    if (confirm("Are you sure you want to delete this task?")) {
        try {
            await deleteTaskFromDb(id);
        tasks = tasks.filter(t => t.id != id);
        updateUI();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Error deleting task. Please try again.');
        }
    }
}

function togglePreview() {
    const container = document.getElementById('preview-tasks-container');
    const btn = document.getElementById('toggle-preview');
    const isHidden = container.classList.toggle('hidden');
    btn.textContent = isHidden ? "Show Next Week Preview" : "Hide Next Week Preview";
}

// --- Task Logic Engine ---

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getEndOfWeek(date) {
    const d = getStartOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
}

function calculateNextDueDate(lastCompleted, frequency) {
    const d = new Date(lastCompleted);
    if (frequency === 'Weekly') {
        d.setDate(d.getDate() + 7);
    } else if (frequency === 'Monthly') {
        d.setMonth(d.getMonth() + 1);
    } else if (frequency === 'Quarterly') {
        d.setMonth(d.getMonth() + 3);
    }
    return d.toISOString().split('T')[0];
}

async function importCSV(csvString) {
    const lines = csvString.split('\n');
    const newTasks = [];
    
    // Skip header
    let monthlyCount = 0;
    let quarterlyCount = 0;

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Simple CSV parser for quoted fields
        const parts = [];
        let current = "";
        let inQuotes = false;
        for (let char of lines[i]) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                parts.push(current);
                current = "";
            } else current += char;
        }
        parts.push(current);

        const room = parts[1];
        const taskName = parts[2];
        const freq = parts[3];
        
        // Initial Staggering Logic
        let nextDue = new Date();
        nextDue.setHours(0, 0, 0, 0);

        if (freq === 'Monthly') {
            // Stagger across 4 weeks
            const weekOffset = monthlyCount % 4;
            nextDue.setDate(nextDue.getDate() + (weekOffset * 7));
            monthlyCount++;
        } else if (freq === 'Quarterly') {
            // Stagger across 12 weeks
            const weekOffset = quarterlyCount % 12;
            nextDue.setDate(nextDue.getDate() + (weekOffset * 7));
            quarterlyCount++;
        }

        newTasks.push({
            id: null,
            room: room,
            task: taskName,
            frequency: freq,
            lastCompleted: null,
            nextDue: nextDue.toISOString().split('T')[0],
            completedThisCycle: false
        });
    }
    
    // Delete all existing tasks and insert new ones
    await deleteAllTasks();
    const savedTasks = await bulkInsertTasks(newTasks);
    tasks = savedTasks;
}

async function handleToggleTask(id) {
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    lastToggledId = id; // Track the task being moved for animation

    if (!task.completedThisCycle) {
        // Marking as completed
        task._prevNextDue = task.nextDue; 
        task.completedThisCycle = true;
        task.lastCompleted = new Date().toISOString().split('T')[0];
        task.nextDue = calculateNextDueDate(task.lastCompleted, task.frequency);
        
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4a90e2', '#2ecc71', '#ff5e5e', '#f1c40f']
        });
    } else {
        // Unmarking
        task.completedThisCycle = false;
        if (task._prevNextDue) {
            task.nextDue = task._prevNextDue;
            delete task._prevNextDue;
        }
        task.lastCompleted = null;
    }

    try {
        await saveTask(task);
        // Reload tasks to ensure sync
        await loadData();
    
    // Brief delay before re-rendering to let the checkbox toggle visually
    // and then trigger the "move to bottom" animation
    setTimeout(() => {
        updateUI();
        // Clear the animation ID after a while so it doesn't re-trigger on other updates
        setTimeout(() => { lastToggledId = null; }, 1000);
    }, 150);
    } catch (error) {
        console.error('Error toggling task:', error);
        alert('Error updating task. Please try again.');
    }
}
