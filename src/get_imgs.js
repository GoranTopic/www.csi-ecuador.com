import fs from 'fs';
import path from 'path';
import he from 'he';
import { exec } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();
// get dotenv files

let domain = 'http://www.csi-ecuador.com/ista/ista30/';

let cookie = process.env.COOKIE;

let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36";

const directoryPath = './storage/www.csi-ecuador.com'; // Set your directory path here
const regex = /data-images=.*/g; // Set your regex pattern here

const get_matches = dir => {
    let matches = [];
    function readHTMLFiles(dir) {
        fs.readdirSync(dir).forEach(file => {
            let fullPath = path.join(dir, file);
            if (fs.lstatSync(fullPath).isDirectory()) {
                readHTMLFiles(fullPath);
            } else if (path.extname(file) === '.html') {
                console.log(domain + file);
                const content = fs.readFileSync(fullPath, 'utf8');
                const fileMatches = content.match(regex);
                if (fileMatches) {
                    for (let i = 0; i < fileMatches.length; i++) {
                        const match = fileMatches[i];
                        // get the title
                        // get and clean the url
                        let url = match.replace('data-images="', '').replace('"', '');
                        url = he.decode(url).split('"')[3]
                        url = domain + url;
                        console.log(url);
                        matches.push(url);
                    }
                    console.log('------------------');
                }
            }
        });
    }
    readHTMLFiles(dir);
    return matches;
}

function downloadImage(url) {
    console.log('downloading ' + url);
    const command = `wget  --header "Cookie: ${cookie}" --user-agent "${userAgent}" "${url}"`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Stdout: ${stdout}`);
    });
}

// for every match, download the image
let matches = get_matches(directoryPath);

// download every match while waiting a random time
for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    //downloadImage(match);
    // wait a random time bw 1 and 1.5 seconds
    await new Promise(r => setTimeout(r, Math.random() * 500 + 1000));
}


//let match = 'http://www.csi-ecuador.com/ista/ista30/mfhandler.php?file=GALARZA%20QUINTANA%20LAURO%20ANTONIO.jpg&table=tab_personas&field=foto_01&pageType=list&page=list&key1=3600&nodisp=1'

//console.log(matches);
