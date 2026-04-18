import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const presetDir = path.join(__dirname, 'server/uploads/avatars/preset');

if (!fs.existsSync(presetDir)) {
  fs.mkdirSync(presetDir, { recursive: true });
}

const svgs = {
  'javascript-1.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f7df1e"/><text x="50" y="60" font-family="Arial" font-size="40" font-weight="bold" fill="#000" text-anchor="middle">JS</text></svg>`,
  'python-1.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#306998"/><text x="50" y="60" font-family="Arial" font-size="30" font-weight="bold" fill="#ffd43b" text-anchor="middle">Py</text></svg>`,
  'web开发-1.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e34f26"/><text x="50" y="60" font-family="Arial" font-size="25" font-weight="bold" fill="#fff" text-anchor="middle">WEB</text></svg>`,
  '机器学习-1.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#6366f1"/><text x="50" y="60" font-family="Arial" font-size="25" font-weight="bold" fill="#fff" text-anchor="middle">AI</text></svg>`,
  'java-1.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#5382a1"/><text x="50" y="60" font-family="Arial" font-size="25" font-weight="bold" fill="#f89820" text-anchor="middle">Java</text></svg>`,
  'cpp-1.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#00599c"/><text x="50" y="60" font-family="Arial" font-size="25" font-weight="bold" fill="#fff" text-anchor="middle">C++</text></svg>`,
};

for (const [filename, content] of Object.entries(svgs)) {
  fs.writeFileSync(path.join(presetDir, filename), content);
  console.log(`Created ${filename}`);
}
