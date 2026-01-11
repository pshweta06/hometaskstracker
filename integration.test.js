const { test, expect } = require('@playwright/test');

test.describe('Integration Tests - Supabase Functionality', () => {
  const BASE_URL = 'http://localhost:8000';

  test('should initialize Supabase client successfully', async ({ page }) => {
    const jsErrors = [];
    const consoleMessages = [];
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Wait for app initialization
    await page.waitForTimeout(5000);

    // Check for Supabase initialization success in console
    const supabaseInitMessages = consoleMessages.filter(msg => 
      msg.text.includes('Supabase client initialized successfully') ||
      msg.text.includes('✅ Supabase client initialized')
    );

    // Check for critical Supabase errors
    const criticalErrors = jsErrors.filter(error =>
      error.includes('Supabase') ||
      error.includes('supabase') ||
      error.includes('createClient') ||
      error.includes('from is not a function')
    );

    // Verify Supabase script loaded (check network requests)
    const supabaseRequests = [];
    page.on('request', request => {
      if (request.url().includes('supabase') || request.url().includes('cdn.jsdelivr.net/npm/@supabase')) {
        supabaseRequests.push(request.url());
      }
    });

    // Check that window.supabaseClient exists
    const supabaseClientExists = await page.evaluate(() => {
      return typeof window.supabaseClient !== 'undefined' && 
             window.supabaseClient !== null &&
             typeof window.supabaseClient.from === 'function' &&
             typeof window.supabaseClient.auth === 'object';
    });

    console.log('Supabase initialization messages:', supabaseInitMessages);
    console.log('Critical errors:', criticalErrors);
    console.log('Supabase client exists:', supabaseClientExists);

    // Fail if there are critical errors
    expect(criticalErrors.length).toBe(0);
    
    // Verify Supabase client is initialized
    expect(supabaseClientExists).toBe(true);
    
    // Verify we got initialization success message
    expect(supabaseInitMessages.length).toBeGreaterThan(0);
  });

  test('should handle login with valid credentials', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Verify Supabase is initialized first
    const supabaseReady = await page.evaluate(() => {
      return typeof window.supabaseClient !== 'undefined' && 
             window.supabaseClient !== null;
    });
    
    expect(supabaseReady).toBe(true);

    // Fill in login credentials
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');

    // Submit login form
    await page.click('#login-form button[type="submit"]');

    // Wait for authentication to complete
    await page.waitForTimeout(5000);

    // Check for error message
    const errorMsg = await page.locator('#login-error').textContent();
    
    // If there's an error, check if it's a Supabase initialization error
    if (errorMsg && errorMsg.trim()) {
      if (errorMsg.includes('not initialized') || errorMsg.includes('Supabase client')) {
        throw new Error(`Supabase initialization failed: ${errorMsg}`);
      }
      // Other errors (like wrong password) are acceptable for this test
      // as long as it's not an initialization error
    }

    // Verify login view is hidden (user logged in)
    const loginView = page.locator('#login-view');
    await expect(loginView).not.toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Verify Supabase is initialized
    const supabaseReady = await page.evaluate(() => {
      return typeof window.supabaseClient !== 'undefined' && 
             window.supabaseClient !== null;
    });
    
    expect(supabaseReady).toBe(true);

    // Try to login with wrong credentials
    await page.fill('#username', 'nonexistentuser12345');
    await page.fill('#password', 'wrongpassword123');
    await page.click('#login-form button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(3000);

    // Should show error message (not initialization error)
    const errorMsg = await page.locator('#login-error').textContent();
    expect(errorMsg).toBeTruthy();
    expect(errorMsg.length).toBeGreaterThan(0);
    
    // Should NOT be an initialization error
    expect(errorMsg).not.toContain('not initialized');
    expect(errorMsg).not.toContain('Supabase client');
    
    // Login view should still be visible
    const loginView = page.locator('#login-view');
    await expect(loginView).toBeVisible();
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Verify Supabase is initialized
    const supabaseReady = await page.evaluate(() => {
      return typeof window.supabaseClient !== 'undefined' && 
             window.supabaseClient !== null;
    });
    
    expect(supabaseReady).toBe(true);

    // Navigate to forgot password
    await page.click('#show-forgot-password');
    await page.waitForTimeout(500);

    // Verify forgot password view is visible
    const forgotPasswordView = page.locator('#forgot-password-view');
    await expect(forgotPasswordView).toBeVisible();

    // Fill in username
    await page.fill('#forgot-username', 'admin');
    await page.click('#forgot-password-form button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(5000);

    // Check for either success or error message (but not initialization error)
    const errorMsg = await page.locator('#forgot-password-error').textContent();
    const successMsg = await page.locator('#forgot-password-success').textContent();
    
    const message = errorMsg || successMsg;
    expect(message).toBeTruthy();
    
    // Should NOT be an initialization error
    if (errorMsg) {
      expect(errorMsg).not.toContain('not initialized');
      expect(errorMsg).not.toContain('Supabase client');
    }
  });

  test('should detect password reset token in URL', async ({ page }) => {
    // Simulate password reset callback URL
    const recoveryUrl = `${BASE_URL}#access_token=test_token&type=recovery&refresh_token=test_refresh`;
    await page.goto(recoveryUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Verify Supabase is initialized
    const supabaseReady = await page.evaluate(() => {
      return typeof window.supabaseClient !== 'undefined' && 
             window.supabaseClient !== null;
    });
    
    expect(supabaseReady).toBe(true);

    // Check that reset password view is visible
    const resetPasswordView = page.locator('#reset-password-view');
    await expect(resetPasswordView).toBeVisible({ timeout: 10000 });

    // Verify form fields exist
    await expect(page.locator('#new-password')).toBeVisible();
    await expect(page.locator('#confirm-password')).toBeVisible();
  });

  test('should verify Supabase API connectivity', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Check that Supabase client can make API calls
    const apiWorking = await page.evaluate(async () => {
      if (!window.supabaseClient) {
        return { success: false, error: 'Client not initialized' };
      }
      
      try {
        // Try to get session (this will fail if not logged in, but should not throw initialization error)
        const { data, error } = await window.supabaseClient.auth.getSession();
        
        // If we get a response (even if no session), the API is working
        return { success: true, hasSession: !!data?.session };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(apiWorking.success).toBe(true);
    expect(apiWorking.error).toBeUndefined();
  });

  test('should handle signup form submission', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Verify Supabase is initialized
    const supabaseReady = await page.evaluate(() => {
      return typeof window.supabaseClient !== 'undefined' && 
             window.supabaseClient !== null;
    });
    
    expect(supabaseReady).toBe(true);

    // Navigate to signup
    await page.click('#show-signup');
    await page.waitForTimeout(500);

    // Fill in signup form
    const testUsername = `testuser${Date.now()}`;
    await page.fill('#signup-username', testUsername);
    await page.fill('#signup-password', 'testpassword123');
    await page.click('#signup-form button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(5000);

    // Check for error message (might be username exists or other validation)
    const errorMsg = await page.locator('#signup-error').textContent();
    
    // Should NOT be an initialization error
    if (errorMsg && errorMsg.trim()) {
      expect(errorMsg).not.toContain('not initialized');
      expect(errorMsg).not.toContain('Supabase client');
    }
  });
});

