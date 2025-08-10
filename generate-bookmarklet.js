#!/usr/bin/env node

const fs = require('fs');

function minify(code) {
    // Remove single-line comments
    // Note: // within quoted strings is ignored since those are valid.
    code = code.replace(/\/\/(?=(?:[^"']*["'][^"']*["'])*[^"']*$).*$/gm, '');

    // Replace all whitespace with single space
    code = code.replace(/\s+/g, ' ');

    // Remove leading/trailing whitespace
    code = code.trim();

    return code;
}

function generateBookmarklet(inputFile) {
    try {
        let code = fs.readFileSync(inputFile, 'utf8');

        // Minify
        code = minify(code);

        // Temporarily remove the javascript: prefix to avoid encoding the `:`
        code = code.replace(/^javascript:/mi, '');

        // URL encode
        code = encodeURIComponent(code);

        // Restore javascript: prefix
        code = `javascript:${code}`;

        return code;
    } catch (error) {
        console.error('Error generating bookmarklet:', error.message);
        process.exit(1);
    }
}

// Main execution
const inputFile = process.argv[2];

if (!inputFile) {
    console.error('Usage: node generate-bookmarklet.js <input-file>');
    process.exit(1);
}

if (!fs.existsSync(inputFile)) {
    console.error(`Error: File '${inputFile}' not found`);
    process.exit(1);
}

const bookmarklet = generateBookmarklet(inputFile);
console.log(bookmarklet);
