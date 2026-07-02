import { test, expect } from '@playwright/test';

const VARIANTS = ['primary', 'secondary', 'ghost', 'outline', 'danger', 'onHero'];

test.describe('Button (design-system component)', () => {
  test('mọi variant render', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('btn-section-title')).toBeVisible({ timeout: 60_000 });
    for (const v of VARIANTS) {
      await expect(page.getByTestId(`btn-${v}`)).toBeVisible();
      await expect(page.getByTestId(`btn-${v}`)).toContainText(`Nút ${v}`);
    }
    await expect(page.getByTestId('btn-loading')).toBeVisible();
    await expect(page.getByTestId('btn-disabled')).toBeVisible();
  });

  test('bấm nút cập nhật trạng thái; nút vô hiệu không chạy', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('btn-primary')).toBeVisible({ timeout: 60_000 });

    await page.getByTestId('btn-primary').click();
    await expect(page.getByTestId('btn-pressed')).toHaveText('primary');

    await page.getByTestId('btn-onHero').click();
    await expect(page.getByTestId('btn-pressed')).toHaveText('onHero');

    // Nút disabled: bấm không đổi trạng thái (vẫn 'onHero').
    await page.getByTestId('btn-disabled').click({ force: true }).catch(() => {});
    await expect(page.getByTestId('btn-pressed')).toHaveText('onHero');
  });
});
