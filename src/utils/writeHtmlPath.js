import fs from 'fs';
import path from 'path';

function ensureDirectoryAndFile(filePath, content) {
    let finalPath = filePath;
    let isDirectory = !path.extname(filePath);

    // If it's a directory, set finalPath to index.html inside the directory
    if (isDirectory) {
        finalPath = path.join(filePath, 'index.html');
    }

    // Ensure directory exists
    const dirname = path.dirname(finalPath);
    console.log(`Ensuring directory ${dirname} exists`);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }

    // If it was a file path, create the file
    fs.writeFileSync(finalPath, content);
}

// Example usage:
ensureDirectoryAndFile('books.toscrape.com/', '<!-- index.html content -->');
ensureDirectoryAndFile('books.toscrape.com/file.txt', 'file content');

// export function without module syntax
export default ensureDirectoryAndFile;