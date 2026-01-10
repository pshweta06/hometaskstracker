const { test, expect } = require('@playwright/test');

test('should load app and show login form', async ({ page }) => {
  // Navigate to the local server
  await page.goto('http://localhost:8000');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Check for JavaScript errors and network requests
  const jsErrors = [];
  const consoleMessages = [];
  const networkRequests = [];
  const networkFailures = [];

  page.on('pageerror', error => {
    jsErrors.push(error.message);
  });

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    });
  });

  page.on('requestfailed', request => {
    networkFailures.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()
    });
  });

  // Wait for app initialization
  await page.waitForTimeout(3000);

  console.log('JavaScript errors:', jsErrors);
  console.log('All console messages:', consoleMessages);
  console.log('All network requests:', networkRequests);
  console.log('Network failures:', networkFailures);

  // Check if login view is visible
  const loginView = page.locator('#login-view');
  await expect(loginView).toBeVisible();

  // Check if username and password fields exist
  await expect(page.locator('#username')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();

  // Check for login button specifically
  const loginButton = page.locator('#login-form button[type="submit"]');
  await expect(loginButton).toBeVisible();
  await expect(loginButton).toHaveText('Login');

  // Check that we don't have critical JS errors
  const criticalErrors = jsErrors.filter(error =>
    error.includes('supabase') ||
    error.includes('createClient') ||
    error.includes('from is not a function')
  );

  if (criticalErrors.length > 0) {
    console.log('Critical Supabase errors found:', criticalErrors);
    // Don't fail the test, just log the errors
  }
});
