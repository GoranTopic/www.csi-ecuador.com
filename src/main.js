import fs from 'fs';
import he from 'he';
import { chromium } from 'playwright';
import Checklist from 'checklist-js';
import UserAgent from 'user-agents';
import dotenv from 'dotenv';
dotenv.config();

let cookie = process.env.COOKIE;

let userAgent = new UserAgent().toString();
console.log(userAgent);

const url_base = 'http://www.csi-ecuador.com/ista/ista30/';
const url_people = 'http://www.csi-ecuador.com/ista/ista30/tab_personas_list.php?goto=';
const domain = 'http://www.csi-ecuador.com';

const storageDir = './storage';
const imagesDir = './storage/images';
const checklistsDir = './storage/checklists';

// Make directory if it doesn't exist
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir);
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);
if (!fs.existsSync(checklistsDir)) fs.mkdirSync(checklistsDir);

let browser = await chromium.launch({
    headless: false,
})
let context = await browser.newContext({
    userAgent: userAgent,
    slowMo: 100,
});

// Add cookies to the browser context
await context.addCookies([{
    url: domain,
    name: 'token',
    value: cookie.split('=')[1],
    // Specify other cookie properties as needed
}]);

let page = await context.newPage(); // Open new page

const pages = new Checklist(
    Array.from({ length: 270}, (_, index) => index ).map(i => url_people + i),
    {
        path: './storage/checklists/',
        name: 'pages',
    }
);

let urlpage = await pages.next();
console.log(urlpage);
while (urlpage) {
    try {
        console.log(`Page ${urlpage} started!`);
        await scrap_personas_page(urlpage);
        pages.check(urlpage);
        console.log(`Page ${urlpage} done!`);
        urlpage = await pages.next();
    } catch (error) {
        // wait for 30 to 60 seconds
        console.log('Error while scraping', error);
        console.log('Restarting browser')
        console.log('Waiting for 60 to 120 seconds')
        await wait(60, 120);
        //
        await browser.close();
        browser = await chromium.launch({
            headless: false,
        })
        userAgent = new UserAgent().toString();
        console.log(`New User Agent: ${userAgent}`)
        context = await browser.newContext({
            userAgent: userAgent,
            slowMo: 100,
        });
        // Add cookies to the browser context
        await context.addCookies([{
            url: domain,
            name: 'token',
            value: cookie.split('=')[1],
            // Specify other cookie properties as needed
        }]);
        // new page
        page = await context.newPage(); // Open new page
    }
}

async function scrap_personas_page(url) {
    await wait(1, 2);
    // go to the url
    await page.goto(url);
    // get all a elements with the title="Ver registro"
    let links = await page.$$('a[title="Ver registro"]');
    console.log(links.length);
    //  get all hrefs from the a tags
    let hrefs = await Promise.all(links.map(async (link) => {
        return await link.getAttribute('href');
    }));
    let href_checklist = new Checklist(hrefs);
    // scrap all the people
    let href = href_checklist.next();
    while (href) {
        await scrap_tab_personas_view(page, href);
        console.log(`Person ${href} done!`);
        href_checklist.check(href);
        href = href_checklist.next();
    }
}

async function scrap_tab_personas_view(page, href) {
    /* scrap the view of the people */
    await wait(1, 2);
    // make the url from the href
    let url = url_base + href;
    // go to the url
    await page.goto(url);
    // get all images tags
    let images = await page.$$('img');
    // donwload all the images
    for(let image of images) await downloadImage(image, './storage/images/');
    // get all a elements with the data-query attribute
    let a_element = await page.$$('a[data-query]');
    // replace all the a elements with the fulltext
    for(let a of a_element) await query_replace_span(a);
    // save the html as a html file of the page with the href name
    await save_html(page, './storage/' + href);
}

async function query_replace_span(a){
    await wait(1, 2);
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

async function getImageBase64(page, url) {
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

function saveBase64Image(base64Data, filePath) {
    return new Promise((resolve, reject) => {
        // Remove Base64 URL prefix (if present) and convert Base64 to binary
        const base64Image = base64Data.split(';base64,').pop();
        // Write the binary data to a file
        fs.writeFile(filePath, base64Image, { encoding: 'base64' }, error => {
            if (error) {
                reject(error);
            } else {
                resolve(`File saved at ${filePath}`);
            }
        });
    });
}

async function downloadImage(image, dir) {
    await wait(1, 2);
    let src = await image.getAttribute('src');
    console.log('src', src);
    const imageFilename = decodeURIComponent(src.split('file=')[1].split('&')[0])
    // download the image
    let imgBuffer = await getImageBase64(page, url_base + src);
    // write the image to a file
    await saveBase64Image(imgBuffer, dir + imageFilename);
    // replace the img src in the html with the name of the image
    await page.evaluate(async ({ image, imageFilename }) => {
        image.src = imageFilename;
    }, ({ image, imageFilename }));
}

async function save_html(page, path) {
    let html = await page.content();
    fs.writeFile(path + '.html', html, function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
}

// make me a function that wait for random seconds between two values
async function wait(min, max) {
    let seconds = Math.random() * (max - min) + min;
    await page.waitForTimeout(seconds * 1000);
}