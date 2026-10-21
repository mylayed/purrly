// Генерує .expo/types/router.d.ts начисто — так само, як `expo start` під час запуску.
//
// Навіщо: на Windows сервер розробки під час інкрементального оновлення псує цей файл.
// У @expo/router-server (typed-routes/index.js) перевірка `relativePath.startsWith('../')`
// не враховує зворотні слеші, тож будь-який змінений файл із src/ потрапляє в маршрути
// як "/../lib/…", а динамічні маршрути на кшталт /cat/[id] зникають.
// Тому `npm run typecheck` спершу генерує типи заново, а потім запускає tsc.
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
// Має бути задано до завантаження модуля: він одразу читає маршрути з цієї теки.
process.env.EXPO_ROUTER_APP_ROOT = path.join(projectRoot, 'src', 'app');

const expoCliDir = path.dirname(
  require.resolve('@expo/cli/package.json', {
    paths: [path.dirname(require.resolve('expo/package.json', { paths: [projectRoot] }))],
  }),
);
const typedRoutes = require(
  require.resolve('@expo/router-server/build/typed-routes', { paths: [expoCliDir] }),
);

const typesDirectory = path.join(projectRoot, '.expo', 'types');
require('node:fs').mkdirSync(typesDirectory, { recursive: true });

// regenerateDeclarations має затримку (debounce) 1 с — чекаємо, поки файл запишеться.
typedRoutes.regenerateDeclarations(typesDirectory, {});
setTimeout(() => {}, 1500);
