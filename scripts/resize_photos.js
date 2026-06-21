#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

const WIDTH = 1130;
const HEIGHT = 698;

function usage() {
    console.log('Usage: node scripts/resize_photos.js <source_dir> <dest_dir>');
    process.exit(1);
}

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (err) {
        // ignore
    }
}

function isImage(filename) {
    return /\.(jpe?g|png|webp|tiff?)$/i.test(filename);
}

async function processFile(srcPath, destPath) {
    try {
        await sharp(srcPath)
            .rotate()
            .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
            .toFile(destPath);
        console.log('Written:', destPath);
    } catch (err) {
        console.error('Failed:', srcPath, err.message || err);
    }
}

async function main() {
    const [, , srcDir, destDir] = process.argv;
    if (!srcDir || !destDir) usage();

    const absSrc = path.resolve(srcDir);
    const absDest = path.resolve(destDir);

    try {
        const entries = await fs.readdir(absSrc);
        await ensureDir(absDest);
        for (const name of entries) {
            if (!isImage(name)) continue;
            const srcPath = path.join(absSrc, name);
            const destPath = path.join(absDest, name);
            await processFile(srcPath, destPath);
        }
        console.log('Done.');
    } catch (err) {
        console.error('Error processing directory:', err.message || err);
        process.exit(2);
    }
}

main();
