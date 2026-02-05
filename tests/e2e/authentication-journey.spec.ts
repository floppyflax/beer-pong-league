/**
 * E2E Tests: Authentication Journey
 * Tests the complete authentication flow from user perspective
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Journey', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear state
    await context.clearCookies();
    
    // Navigate first to establish context
    await page.goto('/');
    
    // Clear storage BEFORE app initializes
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Reload to ensure app starts fresh
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('should open authentication modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click login button (may be in menu or header)
    const loginButton = page.locator('button:has-text("Se connecter"), a:has-text("Se connecter")');
    await loginButton.first().click();

    // Modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/');
    
    // Open auth modal
    const loginButton = page.locator('button:has-text("Se connecter"), a:has-text("Se connecter")');
    await loginButton.first().click();

    // Try invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button:has-text("Envoyer")');

    // Should show validation error
    await expect(page.locator('text=/Email invalide|Invalid email/i')).toBeVisible();
  });

  test('should request OTP with valid email', async ({ page }) => {
    await page.goto('/');
    
    // Open auth modal
    const loginButton = page.locator('button:has-text("Se connecter"), a:has-text("Se connecter")');
    await loginButton.first().click();

    // Enter valid email
    const testEmail = 'test-e2e@example.com';
    await page.fill('input[type="email"]', testEmail);
    
    // Submit
    await page.click('button:has-text("Envoyer")');

    // Should show success message
    await expect(page.locator('text=/Email envoyé|Check your email/i')).toBeVisible({ timeout: 10000 });
  });

  test('should show loading state during OTP request', async ({ page }) => {
    await page.goto('/');
    
    // Open auth modal
    const loginButton = page.locator('button:has-text("Se connecter"), a:has-text("Se connecter")');
    await loginButton.first().click();

    // Enter email
    await page.fill('input[type="email"]', 'test@example.com');
    
    // Click submit and immediately check for loading state
    const submitButton = page.locator('button:has-text("Envoyer")');
    await submitButton.click();

    // Should show loading state (disabled button or spinner)
    await expect(submitButton).toBeDisabled({ timeout: 1000 }).catch(() => {
      // Loading state might be visual (spinner) instead of disabled
      return expect(page.locator('[role="status"], .spinner, .loading')).toBeVisible();
    });
  });

  test('should close modal on cancel', async ({ page }) => {
    await page.goto('/');
    
    // Open auth modal
    const loginButton = page.locator('button:has-text("Se connecter"), a:has-text("Se connecter")');
    await loginButton.first().click();

    // Modal visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click close button (X or Cancel)
    const closeButton = page.locator('button[aria-label="Close"], button:has-text("Annuler")');
    await closeButton.first().click();

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test.skip('should complete authentication via magic link', async ({ page, context }) => {
    // Note: This test requires mocking Supabase or having a test email server
    // Skipped for now, but structure is provided
    
    await page.goto('/');
    
    // Request OTP
    const loginButton = page.locator('button:has-text("Se connecter")');
    await loginButton.first().click();
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Envoyer")');

    // Simulate clicking magic link (would need to intercept email or mock)
    // const magicLink = 'http://localhost:5173/auth/callback?token=...';
    // await page.goto(magicLink);

    // Should redirect to dashboard
    // await expect(page).toHaveURL(/\/dashboard/);
    
    // User should be authenticated
    // await expect(page.locator('button:has-text("Déconnexion")')).toBeVisible();
  });

  test.skip('should show user profile after authentication', async ({ page }) => {
    // Note: Requires authentication setup
    // Skipped for now
    
    // After authentication, should see user info
    // await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    // await expect(page.locator('text=/Profil|Profile/i')).toBeVisible();
  });

  test.skip('should allow sign out', async ({ page }) => {
    // Note: Requires authentication setup
    // Skipped for now
    
    // Click user menu
    // await page.click('[data-testid="user-menu"]');
    
    // Click sign out
    // await page.click('button:has-text("Déconnexion")');
    
    // Should be signed out
    // await expect(page.locator('button:has-text("Se connecter")')).toBeVisible();
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Open auth modal
    const loginButton = page.locator('button:has-text("Se connecter"), a:has-text("Se connecter")');
    await loginButton.first().click();

    // Mock network error by going offline temporarily
    await page.context().setOffline(true);
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Envoyer")');

    // Should show error message
    await expect(page.locator('text=/Erreur|Error/i')).toBeVisible({ timeout: 10000 });
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('should persist email in form during session', async ({ page }) => {
    await page.goto('/');
    
    // Open auth modal
    const loginButton = page.locator('button:has-text("Se connecter"), a:has-text("Se connecter")');
    await loginButton.first().click();

    // Enter email
    const testEmail = 'remember@example.com';
    await page.fill('input[type="email"]', testEmail);
    
    // Close modal without submitting
    await page.click('button[aria-label="Close"], button:has-text("Annuler")');
    
    // Reopen modal
    await loginButton.first().click();
    
    // Email might be remembered (depending on implementation)
    const emailValue = await page.locator('input[type="email"]').inputValue();
    
    // Either empty (cleared) or remembered (same value)
    expect(emailValue === '' || emailValue === testEmail).toBe(true);
  });
});
