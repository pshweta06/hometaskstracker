const { test, expect } = require('@playwright/test');

test.describe('HomeTasks Tracker Login', () => {
  test('should login successfully with admin credentials', async ({ page }) => {
    // Navigate to the local server
    await page.goto('http://localhost:8001');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check for JavaScript errors and console messages
    const jsErrors = [];
    const consoleMessages = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    // Wait for app initialization and Supabase loading
    await page.waitForTimeout(5000);

    console.log('JavaScript errors:', jsErrors);
    console.log('Console messages:', consoleMessages);

    // Check if login view is visible
    const loginView = page.locator('#login-view');
    await expect(loginView).toBeVisible();

    // Fill in login credentials
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation/state change (longer timeout for auth)
    await page.waitForTimeout(5000);

    // Check for error message first
    const errorMsg = await page.locator('#login-error').textContent();
    console.log('Login error message:', errorMsg);

    if (errorMsg && errorMsg.trim()) {
      console.log('Login failed with error:', errorMsg);
      // If there's an error, the test should fail here
      throw new Error(`Login failed: ${errorMsg}`);
    }

    // Check if we're logged in (login view should be hidden)
    const loginViewAfter = page.locator('#login-view');
    await expect(loginViewAfter).not.toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');

    // Wait for login form
    const loginView = page.locator('#login-view');
    await expect(loginView).toBeVisible();

    // Try to login with wrong credentials
    await page.fill('#username', 'wronguser');
    await page.fill('#password', 'wrongpass');
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(3000);

    // Check if error message appears
    const errorMsg = await page.locator('#login-error').textContent();
    expect(errorMsg).toBeTruthy();
    expect(errorMsg.length).toBeGreaterThan(0);
  });
});