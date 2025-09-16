const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  
  // Copy cookies from your browser session if needed
  // await context.addCookies([...]); 
  
  const page = await context.newPage();
  
  // Navigate to the page
  await page.goto('http://localhost:3000/dashboard/cleaning/5999c8bd-9589-4cae-bbb6-4f893326706a');
  
  // Wait for the page to load
  await page.waitForTimeout(3000);
  
  // Take a screenshot
  const screenshot = await page.screenshot({ path: 'cleaning-page.png', fullPage: true });
  console.log('Screenshot saved as cleaning-page.png');
  
  // Check if there's an error
  const errorElement = await page.locator('text=/error|404|not found/i').first();
  if (await errorElement.isVisible()) {
    console.log('Error found on page:', await errorElement.textContent());
  } else {
    console.log('Page loaded successfully');
    
    // Get the title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for cleaning details
    const cleaningStatus = await page.locator('[data-testid="cleaning-status"]').first();
    if (await cleaningStatus.isVisible()) {
      console.log('Cleaning status:', await cleaningStatus.textContent());
    }
  }
  
  await browser.close();
})();