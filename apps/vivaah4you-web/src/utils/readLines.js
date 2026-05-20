const fs = require('fs');
const path = require('path');

/**
 * Read a file and return an array of trimmed non-empty lines.
 * @param {string} filePath
 * @returns {string[]}
 */
function readLines(filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const raw = fs.readFileSync(abs, { encoding: 'utf8' });
  return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
}

module.exports = { readLines };
