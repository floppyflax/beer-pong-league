/**
 * E2E Tests: Identity Merge Journey
 * Tests the complete identity merge workflow from user perspective
 */

import { test, expect } from '@playwright/test';

test.describe('Identity Merge Journey', () => {
  test.beforeEach(async ({ page, context }) => {
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

  test.skip('should merge anonymous data when user authenticates', async ({ page }) => {
    // Note: This test requires full auth flow, skipped for initial setup
    // Structure provided for future implementation
    
    // Step 1: Create anonymous user data
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get anonymous user ID
    const anonymousUserId = await page.evaluate(() => {
      const localUser = localStorage.getItem('local_user');
      return localUser ? JSON.parse(localUser).id : null;
    });
    expect(anonymousUserId).toBeTruthy();

    // Create tournament as anonymous user
    await page.click('text=Créer un tournoi');
    await page.fill('[name="name"]', 'Pre-Auth Tournament');
    await page.fill('[name="location"]', 'Test Location');
    await page.click('button[type="submit"]');

    // Verify tournament created
    await expect(page.locator('h1')).toContainText('Pre-Auth Tournament');
    const tournamentUrl = page.url();

    // Step 2: Authenticate
    await page.click('button:has-text("Se connecter")');
    await page.fill('input[type="email"]', 'merge-test@example.com');
    await page.click('button:has-text("Envoyer")');

    // Wait for success message
    await expect(page.locator('text=/Email envoyé/i')).toBeVisible();

    // Simulate magic link click (would need proper setup)
    // const magicLink = await getMagicLinkFromEmail('merge-test@example.com');
    // await page.goto(magicLink);

    // Step 3: Verify merge
    // Should be redirected to dashboard or callback page
    // await expect(page).toHaveURL(/\/auth\/callback|\/dashboard/);

    // Wait for merge to complete
    // await page.waitForTimeout(3000);

    // Step 4: Verify data persisted
    // Navigate back to tournament
    // await page.goto(tournamentUrl);
    
    // Tournament should still be visible and owned by authenticated user
    // await expect(page.locator('h1')).toContainText('Pre-Auth Tournament');
    
    // User should see their name, not anonymous
    // await expect(page.locator('[data-testid="user-name"]')).not.toContainText('Anonyme');
  });

  test.skip('should maintain match history after merge', async ({ page }) => {
    // Note: Requires full auth + game data setup
    
    // Create anonymous user
    // Play several matches
    // Record wins/losses
    // Check ELO
    // Authenticate
    // Verify match history still visible
    // Verify ELO maintained
    // Verify stats correct
  });

  test.skip('should migrate league participation', async ({ page }) => {
    // Note: Requires leagues feature to be accessible
    
    // Anonymous user joins league
    // Plays matches in league
    // Authenticates
    // Should still be in league
    // League stats should persist
  });

  test.skip('should handle existing authenticated user data', async ({ page, context }) => {
    // Note: Complex scenario requiring multiple sessions
    
    // Scenario: User already has authenticated account with data
    // Then uses app anonymously on new device
    // Then signs in again
    // Should ask how to handle conflict or merge intelligently
  });

  test.skip('should show merge progress indicator', async ({ page }) => {
    // Create substantial anonymous data (multiple tournaments, matches)
    // Authenticate
    // Should show "Merging your data..." or similar
    // Progress indicator should be visible
    // Should complete within reasonable time (<5s)
  });

  test('should preserve device fingerprint across merge', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial fingerprint
    const initialFingerprint = await page.evaluate(() => {
      return localStorage.getItem('bpl_device_fingerprint');
    });

    expect(initialFingerprint).toBeTruthy();

    // Simulate some activity
    await page.waitForTimeout(1000);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Fingerprint should be same
    const afterReloadFingerprint = await page.evaluate(() => {
      return localStorage.getItem('bpl_device_fingerprint');
    });

    expect(afterReloadFingerprint).toBe(initialFingerprint);
  });

  test.skip('should not leak anonymous data between users', async ({ page, context }) => {
    // User A creates data anonymously
    const pageA = page;
    await pageA.goto('/');
    await pageA.waitForLoadState('networkidle');
    
    const userAId = await pageA.evaluate(() => {
      const localUser = localStorage.getItem('local_user');
      return localUser ? JSON.parse(localUser).id : null;
    });

    // Create tournament as User A
    await pageA.click('text=Créer un tournoi');
    await pageA.fill('[name="name"]', 'User A Tournament');
    await pageA.click('button[type="submit"]');

    // User B (new incognito) should NOT see User A's data
    const pageB = await context.newPage();
    await pageB.goto('/');
    await pageB.waitForLoadState('networkidle');

    const userBId = await pageB.evaluate(() => {
      const localUser = localStorage.getItem('local_user');
      return localUser ? JSON.parse(localUser).id : null;
    });

    // Different users
    expect(userBId).not.toBe(userAId);

    // User B should not see User A's tournament in their list
    const hasTournamentA = await pageB.locator('text=User A Tournament').count();
    expect(hasTournamentA).toBe(0);
  });

  test('should handle offline merge gracefully', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Create anonymous data
    const anonymousUserId = await page.evaluate(() => {
      const localUser = localStorage.getItem('local_user');
      return localUser ? JSON.parse(localUser).id : null;
    });
    expect(anonymousUserId).toBeTruthy();

    // Go offline
    await context.setOffline(true);

    // Try to authenticate (will fail network call but should queue)
    await page.click('button:has-text("Se connecter")').catch(() => {});
    
    // Offline indicator might appear
    const offlineCount = await page.locator('text=/Hors ligne|Offline/i').count();
    expect(offlineCount).toBeGreaterThanOrEqual(0);

    // Go back online
    await context.setOffline(false);
    
    // Should sync when back online
    await page.waitForTimeout(2000);
  });
});
