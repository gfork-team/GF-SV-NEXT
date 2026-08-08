import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { extname, join } from 'path';
import { minify } from 'html-minifier';

const BUILD_DIR = 'build';

if (!existsSync(BUILD_DIR)) {
	console.log(`No build directory found at "${BUILD_DIR}". Skipping HTML minification.`);
	process.exit(0);
}

function collectHtmlFiles(dir, results = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			collectHtmlFiles(full, results);
		} else if (entry.isFile() && extname(entry.name) === '.html') {
			results.push(full);
		}
	}
	return results;
}

const files = collectHtmlFiles(BUILD_DIR);

if (files.length === 0) {
	console.log('No HTML files found to minify.');
	process.exit(0);
}

let totalOriginal = 0;
let totalMinified = 0;

for (const file of files) {
	const original = readFileSync(file, 'utf-8');
	const minified = minify(original, {
		collapseWhitespace: true,
		removeComments: true,
		removeRedundantAttributes: true,
		removeScriptTypeAttributes: true,
		removeStyleLinkTypeAttributes: true,
		useShortDoctype: true,
		minifyCSS: true,
		minifyJS: true,
		collapseBooleanAttributes: true,
		removeEmptyAttributes: true,
		keepClosingSlash: false
	});
	writeFileSync(file, minified, 'utf-8');
	const pct = (((original.length - minified.length) / original.length) * 100).toFixed(1);
	console.log(`${file}: ${(original.length / 1024).toFixed(1)}KB → ${(minified.length / 1024).toFixed(1)}KB (${pct}%)`);
	totalOriginal += original.length;
	totalMinified += minified.length;
}

const totalPct = (((totalOriginal - totalMinified) / totalOriginal) * 100).toFixed(1);
console.log(`\nTotal: ${(totalOriginal / 1024).toFixed(1)}KB → ${(totalMinified / 1024).toFixed(1)}KB (${totalPct}%)`);
