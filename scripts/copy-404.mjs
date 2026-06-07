import { copyFileSync, existsSync } from 'node:fs';

const src = 'dist/index.html';
const dest = 'dist/404.html';

if (!existsSync(src)) {
  console.error('copy-404: dist/index.html non trovato. Esegui prima la build.');
  process.exit(1);
}
copyFileSync(src, dest);
console.log('copy-404: creato dist/404.html');
