const fs = require('fs');
const path = require('path');
const { readLines } = require('../src/utils/readLines');

const utilPath = path.join(__dirname, '..', 'src', 'utils', 'communitiesByReligion.ts');
const castePath = path.join(__dirname, '..', 'src', 'app', 'profile', 'register', 'caste.txt');

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function buildHinduArray(lines) {
  return lines.map(l => `    { value: '${slugify(l)}', label: '${l}' }`).join(',\n');
}

function main() {
  const lines = readLines(castePath);
  if (!lines.length) {
    console.log('No castes found in', castePath);
    return;
  }

  const hinduArray = buildHinduArray(lines);

  const fileContent = `export const communitiesByReligion: { [key: string]: { value: string; label: string }[] } = {\n` +
    `  hindu: [\n${hinduArray}\n  ],\n` +
    `  muslim: [\n    { value: 'shia', label: 'Shia' },\n    { value: 'sunni', label: 'Sunni' },\n    { value: 'other', label: 'Other' },\n  ],\n` +
    `  christian: [\n    { value: 'catholic', label: 'Catholic' },\n    { value: 'protestant', label: 'Protestant' },\n    { value: 'orthodox', label: 'Orthodox' },\n    { value: 'other', label: 'Other' },\n  ],\n` +
    `  sikh: [\n    { value: 'jatt', label: 'Jatt' },\n    { value: 'other', label: 'Other' },\n  ],\n` +
    `  jain: [\n    { value: 'digambara', label: 'Digambara' },\n    { value: 'svetambara', label: 'Svetambara' },\n    { value: 'other', label: 'Other' },\n  ],\n` +
    `  others: [\n    { value: 'other', label: 'Other' },\n  ],\n};\n`;

  fs.writeFileSync(utilPath, fileContent, 'utf8');
  console.log('Wrote communitiesByReligion to', utilPath);
}

main();
