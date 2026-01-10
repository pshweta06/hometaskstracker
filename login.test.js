const { test, expect } = require('@playwright/test');

test.describe('HomeTasks Tracker Login', () => {
  test('should login successfully with admin credentials', async ({ page }) => {
    // Navigate to the local server
    await page.goto('http://localhost:8000');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if login view is visible
    const loginView = page.locator('#login-view');
    await expect(loginView).toBeVisible();

    // Fill in login credentials
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation/state change (either dashboard or error)
    await page.waitForTimeout(2000); // Wait for async operations

    // Check if we're logged in by looking for the dashboard or admin panel
    // The login view should be hidden and dashboard should be visible
    const loginViewAfter = page.locator('#login-view');
    const userDashboard = page.locator('#user-dashboard');
    const adminPanel = page.locator('#admin-panel');

    // Check console for errors
    const errors = [];
    const allMessages = [];
    page.on('console', msg => {
      allMessages.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit more for any async operations
    await page.waitForTimeout(2000);
    
    // Log all console messages for debugging
    console.log('All console messages:', allMessages);

    // Check if login was successful (either dashboard or admin panel should be visible)
    const isLoggedIn = await userDashboard.isVisible().catch(() => false) || 
                       await adminPanel.isVisible().catch(() => false);

    // Log the current state for debugging
    const currentView = await loginViewAfter.isVisible() ? 'login' : 
                       (await userDashboard.isVisible() ? 'dashboard' : 
                       (await adminPanel.isVisible() ? 'admin' : 'unknown'));

    console.log('Current view:', currentView);
    console.log('Console errors:', errors);

    // Check for error message
    const errorMsg = await page.locator('#login-error').textContent();
    if (errorMsg) {
      console.log('Login error message:', errorMsg);
    }

    // If there are errors, log them but don't fail the test yet
    if (errors.length > 0) {
      console.log('JavaScript errors found:', errors);
    }

    // The test passes if we're not on the login view anymore
    // (meaning we successfully navigated away from login)
    await expect(loginViewAfter).not.toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');

    // Try to login with wrong credentials
    await page.fill('#username', 'wronguser');
    await page.fill('#password', 'wrongpass');
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(2000);

    // Check if error message appears
    const errorMsg = await page.locator('#login-error').textContent();
    expect(errorMsg).toBeTruthy();
    expect(errorMsg.length).toBeGreaterThan(0);
  });
});

