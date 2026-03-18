// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Login Page - Functionality Tests', () => {

  test('TC-L01: Login page loads and shows form elements', async ({ page }) => {
    await page.goto('/');

    // The app should load without errors
    await expect(page).toHaveTitle(/.+/);

    // Navigate to login - try common routes
    await page.goto('/login');

    // Login form elements should be visible
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });

    console.log('✅ Login form elements (email + password) are visible');
  });

  test('TC-L02: Login form shows validation error on empty submit', async ({ page }) => {
    await page.goto('/login');

    // Wait for form to load
    const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await expect(submitBtn).toBeVisible({ timeout: 10000 });

    // Click submit without filling anything
    await submitBtn.click();

    // Should show some kind of error or validation (HTML5 required, or custom error)
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();

    // Check the email input is invalid (HTML5 validation) or an error message appears
    const isInvalid = await emailInput.evaluate(el => !el.validity.valid);
    const errorMsg = page.locator('text=/required|invalid|enter.*email/i').first();

    const hasError = isInvalid || await errorMsg.isVisible().catch(() => false);
    expect(hasError).toBeTruthy();

    console.log('✅ Empty submit correctly triggers validation');
  });

  test('TC-L03: Login form accepts input in email and password fields', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });

    // Type into both fields
    await emailInput.fill('owner@marinesurvey.com');
    await passwordInput.fill('Test@1234');

    // Verify values are typed correctly
    await expect(emailInput).toHaveValue('owner@marinesurvey.com');
    await expect(passwordInput).toHaveValue('Test@1234');

    console.log('✅ Email and password fields accept input correctly');
  });

  test('TC-L04: Invalid credentials shows error message', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();

    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // Enter wrong credentials
    await emailInput.fill('wrong@example.com');
    await passwordInput.fill('wrongpassword');
    await submitBtn.click();

    // The Login component renders errors in a red div (bg-red-500/20 text-red-100)
    const errorDiv = page.locator('[class*="bg-red-500"], [class*="text-red-100"]').first();
    await expect(errorDiv).toBeVisible({ timeout: 12000 });

    console.log('✅ Invalid credentials correctly shows error message');
  });

  test('TC-L05: Password field masks input (type=password)', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 10000 });

    // Confirm the field type is "password" (masks text)
    const inputType = await passwordInput.getAttribute('type');
    expect(inputType).toBe('password');

    console.log('✅ Password field correctly masks input');
  });

});
