import fs from 'fs';
import dotenv from 'dotenv';
import { chromium } from 'playwright';
dotenv.config();

let cookie = process.env.COOKIE;

const url = 'http://www.csi-ecuador.com/ista/ista30/menu.php';
const domain = 'http://www.csi-ecuador.com';

const browser = await chromium.launch({
    headless: false,
})
const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) '
});

// Add cookies to the browser context
await context.addCookies([{
    url: domain,
    name: 'token',
    value: cookie.split('=')[1],
    // Specify other cookie properties as needed
}]);

const page = await context.newPage(); // Open new page

try {
    await page.goto(url); // Go to the url
    // Perform any actions you need on the page here

    console.log('Page loaded with custom user agent and cookies.');

    // You can add more code here to interact with the page

} catch (error) {
    console.error('Failed to load the page:', error);
} finally {
    //await browser.close(); // Close the browser
}
