import fs from 'fs';
import he from 'he';
import { chromium } from 'playwright';
import dotenv from 'dotenv';
dotenv.config();

let cookie = process.env.COOKIE;

let userAgent = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P)';

const url_base = 'http://www.csi-ecuador.com/ista/ista30/';
const url_people = 'http://www.csi-ecuador.com/ista/ista30/tab_personas_list.php';
const domain = 'http://www.csi-ecuador.com';

const browser = await chromium.launch({
    headless: false,
})
const context = await browser.newContext({
    userAgent: userAgent,
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

    await scrap_tab_personas_view(page, url_base + hrefs[4]);
    // You can add more code here to interact with the page

} catch (error) {
    console.error('Failed to load the page:', error);
} finally {
    //await browser.close(); // Close the browser
}


async function scrap_tab_personas_view(page, url) {
    /* scrap the view of the people */
    // go to the url
    await page.goto(url);
    // get all images tags
    let images = await page.$$('img');
    // get the src of the first image
    let src = await images[0].getAttribute('src');
    // download the image
    let imgBuffer = await getImageBuffer(page, url_base + src);
    // get the name of the image

    // get all a elements with the data-query attribute
    //let a_element = await page.$$('a[data-query]');
    // replace all the a elements with the fulltext
    //for(let a of a_element) await query_replace_span(a);
}

async function query_replace_span(a){
    // get the url
    let link = url_base + await a.getAttribute('data-query');
    // get parent span tag
    let span = await a.$('xpath=../..');
    // make a get request from 
    let fulltext = await page.evaluate(async ({link, userAgent}) => {
        let response = await window.fetch(link, {
            "credentials": "include",
            "headers": {
                "User-Agent": userAgent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Content-Type": "multipart/form-data; boundary=---------------------------32765182862314041389985411710",
                "Upgrade-Insecure-Requests": "1",
                "Sec-GPC": "1",
                "Pragma": "no-cache",
                "Cache-Control": "no-cache"
            },
            "method": "POST",
            "mode": "cors"
        });
        return await response.text();
    }, ({link, userAgent}));
    // parse the text
    fulltext = JSON.parse(he.decode(fulltext)).textCont;
    // replace span text with fulltext
    span.innerText = fulltext;
    await page.evaluate(async ({span, fulltext}) => {
        span.innerText = fulltext;
    }, ({span, fulltext}));
}

async function getImageBuffer(page, url) {
    // download the image
    let imgEncode64 = await page.evaluate(async ({ url, userAgent }) => {
        return await window.fetch(url, {
            "credentials": "include",
            "headers": {
                "User-Agent": userAgent,
                "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Pragma": "no-cache",
                "Cache-Control": "no-cache"
            },
            "method": "GET",
            "mode": "cors"
        }).then(async res => await res.blob())
            .then(blob => new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onloadend = () => res(reader.result);
                reader.onerror = rej;
                reader.readAsDataURL(blob);
            }))
    }, ({ url, userAgent }));
    return imgEncode64;
}

