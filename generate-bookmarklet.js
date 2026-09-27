#!/usr/bin/env node
// Rebuilds the bookmarklet in README.md from original-source.js.
//
// Usage: node generate-bookmarklet.js          (updates README.md)
//        node generate-bookmarklet.js --check  (exits 1 if README.md is out of date)

const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'original-source.js');
const readmePath = path.join(__dirname, 'README.md');

// Everything after the `javascript:` prefix is URL encoded as is. Comments are
// kept rather than stripped: newlines are encoded too, so `//` comments stay safe.
const source = fs.readFileSync(sourcePath, 'utf8');
const prefixIndex = source.indexOf('javascript:');
if (prefixIndex === -1) {
    console.error('original-source.js has no javascript: prefix');
    process.exit(1);
}
const body = source.slice(prefixIndex + 'javascript:'.length).replace(/\n$/, '');
const bookmarklet = 'javascript:' + encodeURIComponent(body);

const readme = fs.readFileSync(readmePath, 'utf8');
const bookmarkletLine = /^javascript:.*$/m;
if (!bookmarkletLine.test(readme)) {
    console.error('README.md has no line starting with javascript: to replace');
    process.exit(1);
}
const updated = readme.replace(bookmarkletLine, () => bookmarklet);

if (process.argv.includes('--check')) {
    if (updated !== readme) {
        console.error('README.md bookmarklet is out of date. Run: node generate-bookmarklet.js');
        process.exit(1);
    }
    console.log('README.md bookmarklet is up to date.');
} else {
    fs.writeFileSync(readmePath, updated);
    console.log('Updated README.md bookmarklet (' + bookmarklet.length + ' characters).');
}
