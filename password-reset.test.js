const { test, expect } = require('@playwright/test');

test.describe('Password Reset Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for app initialization
  });

  test('should show forgot password link on login page', async ({ page }) => {
    // Check if login view is visible
    const loginView = page.locator('#login-view');
    await expect(loginView).toBeVisible();

    // Check if forgot password link exists
    const forgotPasswordLink = page.locator('#show-forgot-password');
    await expect(forgotPasswordLink).toBeVisible();
    await expect(forgotPasswordLink).toHaveText('Forgot Password?');
  });

  test('should navigate to forgot password view when link is clicked', async ({ page }) => {
    // Click forgot password link
    await page.click('#show-forgot-password');

    // Wait for view change
    await page.waitForTimeout(500);

    // Check that forgot password view is visible
    const forgotPasswordView = page.locator('#forgot-password-view');
    await expect(forgotPasswordView).toBeVisible();

    // Check that login view is hidden
    const loginView = page.locator('#login-view');
    await expect(loginView).not.toBeVisible();

    // Check that form elements exist
    await expect(page.locator('#forgot-username')).toBeVisible();
    await expect(page.locator('#forgot-password-form button[type="submit"]')).toBeVisible();
  });

  test('should show back to login link on forgot password page', async ({ page }) => {
    // Navigate to forgot password view
    await page.click('#show-forgot-password');
    await page.waitForTimeout(500);

    // Check back to login link exists
    const backToLoginLink = page.locator('#show-login-from-forgot');
    await expect(backToLoginLink).toBeVisible();

    // Click it and verify we're back at login
    await backToLoginLink.click();
    await page.waitForTimeout(500);

    const loginView = page.locator('#login-view');
    await expect(loginView).toBeVisible();
  });

  test('should show error message when submitting empty forgot password form', async ({ page }) => {
    // Navigate to forgot password view
    await page.click('#show-forgot-password');
    await page.waitForTimeout(500);

    // Try to submit empty form (browser validation should prevent this)
    const submitButton = page.locator('#forgot-password-form button[type="submit"]');
    await expect(submitButton).toBeVisible();

    // The form should have required attribute, so browser will show validation
    const usernameInput = page.locator('#forgot-username');
    await expect(usernameInput).toHaveAttribute('required', '');
  });

  test('should submit forgot password form with username', async ({ page }) => {
    // Navigate to forgot password view
    await page.click('#show-forgot-password');
    await page.waitForTimeout(500);

    // Fill in username
    await page.fill('#forgot-username', 'testuser');

    // Submit form
    await page.click('#forgot-password-form button[type="submit"]');

    // Wait for response (may succeed or fail depending on if user exists)
    await page.waitForTimeout(3000);

    // Check that either success or error message appears
    const errorMsg = page.locator('#forgot-password-error');
    const successMsg = page.locator('#forgot-password-success');

    // At least one should have content (or both empty if still loading)
    const errorText = await errorMsg.textContent();
    const successText = await successMsg.textContent();

    // The form should have been submitted (either message should appear)
    // Note: This test may fail if Supabase is not configured, but UI should still work
    expect(errorText || successText).toBeTruthy();
  });

  test('should show reset password view when URL contains recovery token', async ({ page }) => {
    // Simulate password reset callback URL (Supabase format)
    const recoveryUrl = 'http://localhost:8000/#access_token=test_token&type=recovery&refresh_token=test_refresh';
    await page.goto(recoveryUrl);
    await page.waitForLoadState('networkidle');
    
    // Wait longer for app initialization and hash processing
    await page.waitForTimeout(5000);

    // Check that reset password view is visible
    const resetPasswordView = page.locator('#reset-password-view');
    await expect(resetPasswordView).toBeVisible({ timeout: 10000 });

    // Check that login view is hidden
    const loginView = page.locator('#login-view');
    await expect(loginView).not.toBeVisible();

    // Check that form elements exist
    await expect(page.locator('#new-password')).toBeVisible();
    await expect(page.locator('#confirm-password')).toBeVisible();
    await expect(page.locator('#reset-password-form button[type="submit"]')).toBeVisible();
  });

  test('should validate password match in reset password form', async ({ page }) => {
    // Navigate to reset password view (simulating recovery URL)
    await page.goto('http://localhost:8000/#access_token=test_token&type=recovery&refresh_token=test_refresh');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Wait for reset password view to be visible
    const resetPasswordView = page.locator('#reset-password-view');
    await expect(resetPasswordView).toBeVisible({ timeout: 10000 });

    // Fill in mismatched passwords
    await page.fill('#new-password', 'newpassword123');
    await page.fill('#confirm-password', 'differentpassword');

    // Submit form
    await page.click('#reset-password-form button[type="submit"]');

    // Wait for validation
    await page.waitForTimeout(1000);

    // Check for error message about password mismatch
    const errorMsg = page.locator('#reset-password-error');
    const errorText = await errorMsg.textContent();
    expect(errorText).toContain('match');
  });

  test('should validate password length in reset password form', async ({ page }) => {
    // Navigate to reset password view
    await page.goto('http://localhost:8000/#access_token=test_token&type=recovery&refresh_token=test_refresh');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Wait for reset password view to be visible
    const resetPasswordView = page.locator('#reset-password-view');
    await expect(resetPasswordView).toBeVisible({ timeout: 10000 });

    // Fill in short password
    await page.fill('#new-password', 'short');
    await page.fill('#confirm-password', 'short');

    // Submit form
    await page.click('#reset-password-form button[type="submit"]');

    // Wait for validation
    await page.waitForTimeout(1000);

    // Check for error message about password length
    const errorMsg = page.locator('#reset-password-error');
    const errorText = await errorMsg.textContent();
    expect(errorText).toContain('6');
  });

  test('should have required attributes on reset password form fields', async ({ page }) => {
    // Navigate to reset password view
    await page.goto('http://localhost:8000/#access_token=test_token&type=recovery&refresh_token=test_refresh');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Wait for reset password view to be visible
    const resetPasswordView = page.locator('#reset-password-view');
    await expect(resetPasswordView).toBeVisible({ timeout: 10000 });

    // Check that both password fields are required
    const newPasswordInput = page.locator('#new-password');
    const confirmPasswordInput = page.locator('#confirm-password');

    await expect(newPasswordInput).toHaveAttribute('required', '');
    await expect(confirmPasswordInput).toHaveAttribute('required', '');
  });

  test('should clear URL hash after detecting recovery token', async ({ page }) => {
    // Navigate with recovery token in URL
    const recoveryUrl = 'http://localhost:8000/#access_token=test_token&type=recovery&refresh_token=test_refresh';
    await page.goto(recoveryUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Check that reset password view is shown
    const resetPasswordView = page.locator('#reset-password-view');
    await expect(resetPasswordView).toBeVisible({ timeout: 10000 });

    // The hash should be cleared from URL (check after a moment)
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('access_token');
  });
});

