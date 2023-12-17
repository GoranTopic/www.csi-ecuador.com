import fs from 'fs';
import dotenv from 'dotenv';
import { chromium } from 'playwright';
dotenv.config();

let cookie = process.env.COOKIE;

const url_base = 'http://www.csi-ecuador.com/ista/ista30/';
const url_people = 'http://www.csi-ecuador.com/ista/ista30/tab_personas_list.php';
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
    await page.goto( url_people ) // Go to the url
    // Perform any actions you need on the page here
    // get all a elements with the title="Ver registro"
    let links = await page.$$('a[title="Ver registro"]');
    console.log(links.length);
    //  get all hrefs from the a tags
    let hrefs = await Promise.all(links.map(async (link) => {
        return await link.getAttribute('href');
    }));
    console.log(hrefs.length);
    console.log(hrefs);
    console.log('Page loaded with custom user agent and cookies.');

    await scrap_tab_personas_view(page, url_base + hrefs[0]);
    // You can add more code here to interact with the page

} catch (error) {
    console.error('Failed to load the page:', error);
} finally {
    //await browser.close(); // Close the browser
}


async function scrap_tab_personas_view(page, url){
    // scrap the view of the people
    // go to the url
    await page.goto(url);
    // print html
    //console.log(await page.content());
    // get an replace more span text
    // find a tag with data-query atribute
    // get link
    let a = await page.$('a[data-query]');
    let link = url_base + await a.getAttribute('data-query');
    console.log(link);
    // make a get request from 
    const fulltext = await page.evaluate(async link => {
        let response = await window.fetch(link);
        let data = await response.json();
        console.log(data);
        return data;
    }, link);
    console.log(fulltext);
    // get parent span tag
    let span = await a.$('xpath=../..');
    console.log(await span.innerText());
    
}