const { test, expect } = require('@playwright/test');

test('debug supabase loading', async ({ page }) => {
  await page.goto('http://localhost:8001/debug.html');

  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  await page.waitForTimeout(3000);

  console.log('Debug console messages:', consoleMessages);

  // Should see the logs from the HTML
  expect(consoleMessages.length).toBeGreaterThan(0);
});
