import fs from 'fs';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const url = 'http://www.csi-ecuador.com/ista/ista30/menu.php';

let cookie = process.env.COOKIE;

let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36";

const regex = /data-images=.*/g; // Set your regex pattern here

let headers =  `--header Cookie: ${cookie}'`;

// options
let mirror =  '--mirror'
let convertLinks = '--convert-links'
let adjustExtension = '--adjust-extension'
let pageRequisites = '--page-requisites'
let noParent = '--no-parent'

// if dir does not exit, create it
let dir = './storage/';
if (!fs.existsSync(dir)) fs.mkdirSync(dir);
process.chdir(dir);


// for some reason this does not work
// and 'arg1', 'arg2', ... with the arguments for the command
const command = 'wget';
const args = [
    //'--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"',
    '--header="Cookie: token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6IlVTLTAwMS01LTEyIiwiZXhwIjoxNzA0Mzk1NDMyfQ.3K9uOa82yGrtnrMEMIv074vCynnUVSTo0FBsHXxKLjs;s1692825968=3394d34846978786d6524458e2ef2a37"',
    '--mirror',
    '--convert-links',
    '--adjust-extension',
    '--page-requisites',
    '--no-parent',
    'http://www.csi-ecuador.com/ista/ista30/menu.php'
];

const child = spawn(command, args);

child.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

child.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});

