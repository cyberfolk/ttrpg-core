# Vue/React su GitHub Pages

L'app ttrpg-core ad'ora è vanilla JS, statica, dati in `localStorage`.   
Ma Posso riscriverla in Vue/React, rimanendo sempre GitHub Pages!

Cambierebbero:

- Vue/React buildano in file statici
- GitHub Pages li serve.
- Vue/React = `npm run build` produce una cartella `dist/`.
- Pages deve servire `dist/`, non il sorgente.
- Soluzione: **GitHub Actions** a ogni push builda e pubblica `dist/`
- Il sito sta sotto `/ttrpg-core/`.
- Va detto al bundler il base path, altrimenti gli asset vanno in 404:
- Vite: `base: '/ttrpg-core/'` in `vite.config`.
- Con URL veri e paginazione devo impostare: hash-routing