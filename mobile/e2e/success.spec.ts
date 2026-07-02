import { test, expect } from '@playwright/test';

// react-native-web ánh xạ prop `testID` → thuộc tính DOM `data-testid`,
// nên getByTestId dùng được thẳng.
test.describe('SuccessScreen (design-system component)', () => {
  test('render tiêu đề, phụ đề, nút; nút primary chạy', async ({ page }) => {
    await page.goto('/');

    // Chờ bundle react-native-web render (lần đầu tải hơi lâu).
    const title = page.getByTestId('success-title');
    await expect(title).toBeVisible({ timeout: 60_000 });
    await expect(title).toHaveText('Đã điểm danh!');

    // Phụ đề
    await expect(page.getByTestId('success-sub')).toContainText('có mặt');

    // Hai nút hiển thị (theo nhãn)
    await expect(page.getByText('Nhắn Zalo hỏi thăm')).toBeVisible();
    await expect(page.getByText('Về trang chính')).toBeVisible();

    // Cờ chưa bấm
    await expect(page.getByTestId('primary-pressed')).toHaveText('IDLE');

    // Bấm nút primary → cờ chuyển PRESSED (onPress chạy)
    await page.getByText('Nhắn Zalo hỏi thăm').click();
    await expect(page.getByTestId('primary-pressed')).toHaveText('PRESSED');
  });

  test('vòng tròn ✓ hiển thị', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('success-screen')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('✓')).toBeVisible();
  });
});
