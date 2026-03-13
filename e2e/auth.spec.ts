import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('Signin page loads and shows form', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Signup page loads and shows form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Reset password page loads', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Unauthenticated visit to /dashboard redirects to /signin', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/signin/);
  });

  test('Signup link is visible on signin page', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.locator('a[href="/signup"]')).toBeVisible();
  });

  test('Forgot password link is visible on signin page', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.locator('a[href="/reset-password"]')).toBeVisible();
  });
});
