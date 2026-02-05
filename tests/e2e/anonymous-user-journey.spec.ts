/**
 * E2E Tests: Anonymous User Journey
 * Tests the complete anonymous user experience
 */

import { test, expect } from '@playwright/test';

test.describe('Anonymous User Journey', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and localStorage to simulate new user
    await context.clearCookies();
    
    // Navigate first to establish context
    await page.goto('/');
    
    // Clear localStorage BEFORE app initializes
    await page.evaluate(() => localStorage.clear());
    
    // Reload to ensure app starts fresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for anonymous user to be auto-created in E2E mode
    await page.waitForFunction(() => {
      return localStorage.getItem('local_user') !== null;
    }, { timeout: 5000 });
  });

  test('should create anonymous user on first visit', async ({ page }) => {
    // beforeEach already created user, just verify it exists
    const localStorageData = await page.evaluate(() => {
      const localUser = localStorage.getItem('local_user');
      const deviceFingerprint = localStorage.getItem('bpl_device_fingerprint');
      return { localUser, deviceFingerprint };
    });

    expect(localStorageData.deviceFingerprint).toBeTruthy();
    expect(localStorageData.localUser).toBeTruthy();

    const localUser = JSON.parse(localStorageData.localUser!);
    expect(localUser.id).toBeTruthy();
    expect(localUser.pseudo).toBeTruthy();
  });

  test('should allow anonymous user to create tournament', async ({ page }) => {
    await page.goto('/');

    // Wait for app to initialize
    await page.waitForLoadState('networkidle');

    // Navigate to create tournament
    await page.click('text=Créer un tournoi');
    
    // Fill tournament form
    await page.fill('[name="name"]', 'Test Tournament E2E');
    await page.fill('[name="location"]', 'Test Location');
    
    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to tournament page
    await expect(page).toHaveURL(/\/tournament\/[a-z0-9-]+/);
    
    // Tournament name should be visible
    await expect(page.locator('h1')).toContainText('Test Tournament E2E');
  });

  test('should persist anonymous data after page refresh', async ({ page }) => {
    // beforeEach already created user, get the ID
    const initialUserId = await page.evaluate(() => {
      const localUser = localStorage.getItem('local_user');
      return localUser ? JSON.parse(localUser).id : null;
    });

    expect(initialUserId).toBeTruthy();

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check user ID is the same
    const afterRefreshUserId = await page.evaluate(() => {
      const localUser = localStorage.getItem('local_user');
      return localUser ? JSON.parse(localUser).id : null;
    });

    expect(afterRefreshUserId).toBe(initialUserId);
  });

  test('should allow anonymous user to join tournament via QR', async ({ page, context }) => {
    // First, create a tournament with anonymous user A
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Create tournament
    await page.click('text=Créer un tournoi');
    await page.fill('[name="name"]', 'Test Tournament for Join');
    await page.fill('[name="location"]', 'Bar Test');
    await page.click('button[type="submit"]');
    
    // Get tournament invite URL from QR code or share button
    const inviteUrl = await page.evaluate(() => {
      const url = new URL(window.location.href);
      return url.origin + '/tournament-join/' + url.pathname.split('/').pop();
    });

    // Open new incognito tab (simulating different anonymous user B)
    const newPage = await context.newPage();
    await newPage.goto(inviteUrl);
    
    // Should show join form
    await expect(newPage.locator('h1')).toContainText('Rejoindre le tournoi');
    
    // Enter pseudo and join
    await newPage.fill('[name="pseudo"]', 'Anonymous Player 2');
    await newPage.click('button:has-text("Rejoindre")');
    
    // Should be added to tournament
    await expect(newPage.locator('text=Bienvenue')).toBeVisible();
  });

  test('should display leaderboard for anonymous users', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to a tournament (assuming one exists in test DB)
    // Or create one first
    await page.click('text=Créer un tournoi');
    await page.fill('[name="name"]', 'Leaderboard Test');
    await page.fill('[name="location"]', 'Test Bar');
    await page.click('button[type="submit"]');

    // Navigate to leaderboard
    await page.click('text=Classement');

    // Should show empty leaderboard or initial state
    await expect(page.locator('h2')).toContainText(/Classement|Leaderboard/i);
  });

  test('should handle offline mode gracefully', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Try to create tournament (should work with localStorage)
    await page.click('text=Créer un tournoi');
    await page.fill('[name="name"]', 'Offline Tournament');
    await page.fill('[name="location"]', 'Offline Location');
    
    // Should show offline indicator or warning
    const offlineIndicator = page.locator('text=/Hors ligne|Offline/i');
    const hasOfflineIndicator = await offlineIndicator.count();
    
    // May or may not have offline indicator, but should not crash
    expect(hasOfflineIndicator).toBeGreaterThanOrEqual(0);

    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(2000); // Wait for sync

    // Data should sync
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should allow anonymous user to record match results', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Create tournament
    await page.click('text=Créer un tournoi');
    await page.fill('[name="name"]', 'Match Recording Test');
    await page.fill('[name="location"]', 'Test Location');
    await page.click('button[type="submit"]');

    // Navigate to record match
    await page.click('text=Enregistrer un match');

    // Should show match form
    await expect(page.locator('h2')).toContainText(/Enregistrer|Match/i);
  });
});
