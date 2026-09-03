# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ENTO Web — static product catalog site for ENTO (Aislantes e Ingeniería), a distributor of accessories/insulators for medium and low voltage equipment. Angular 22 standalone app with SSR/prerender, **no backend**: all content is served as static JSON and rendered at build time. Full spec (in Spanish) is in [ESPECIFICACIONES.md](ESPECIFICACIONES.md) — read it for business rules before changing filtering/sorting logic.

Deployed to GitHub Pages under a subpath (`/ENTO-WEB/`), built via [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) on every push to `main`.

## Commands

### Docker (standard dev environment)

The dev server runs **inside Docker** via [docker-compose.yml](docker-compose.yml) — this is the standard way to run the app locally, not a fallback. It's a `node:24-alpine` container that bind-mounts the repo into `/workspace` and runs `ng serve` on `0.0.0.0:4200` with `--allowed-hosts` (Angular's Vite dev server rejects unfamiliar `Host` headers by default; required since requests arrive from outside the container network).

```bash
docker compose up          # start the dev server container (ento-web-dev), http://localhost:4200/
docker compose up -d       # same, detached
docker compose down        # stop and remove the container
docker compose logs -f web # follow ng serve output
```

Because the repo is bind-mounted, editing files on the host is reflected immediately inside the container (no rebuild needed). `node_modules` is installed inside the container on start (`npm ci`); if `package.json` changes, restart the container (`docker compose up -d --force-recreate`) to reinstall.

**Hot-reload uses polling, not inotify.** On Windows/Laragon bind mounts, native filesystem change events don't propagate into the Linux container, so `ng serve`'s watcher would otherwise never see host edits. The compose file sets `CHOKIDAR_USEPOLLING=true`/`CHOKIDAR_INTERVAL=1000` and passes `--poll 1000` to `ng serve` to work around this — edits to `.ts`/`.html`/`.scss` files are picked up within ~1-3s and trigger an HMR update ("Component update sent to client(s)" in `docker compose logs`), no container restart needed. If a change still doesn't appear after a few seconds, check `docker compose logs -f web` for a rebuild before assuming anything is broken.

**Before assuming the dev server is up, check it — don't assume from a prior session.** On a cold start, `npm ci` reinstalls all dependencies inside the container from scratch, which takes several minutes (not seconds) with no console output in between — this is expected, not a hang. To check current state:

```bash
docker compose ps                                     # is the container running?
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4200/  # 200 = ng serve is ready; 000 = not up yet
docker compose logs --tail=40 web                     # see npm ci / ng serve progress
docker exec ento-web-dev ps aux                       # confirm whether npm ci or ng serve is the active process
```

If `curl` returns `000` and `ps aux` shows `npm ci` still running, wait and re-check rather than restarting the container — restarting resets the `npm ci` progress. Once `ng serve` is the running process (or curl returns `200`), the app is ready at `http://localhost:4200/`.

### Build, test, lint

These run either inside the running container (`docker compose exec web <cmd>`) or locally with Node if you have it installed:

```bash
npm run build          # ng build — production build to dist/ento-web/
npm run watch           # ng build --watch --configuration development
npm test               # ng test — Vitest unit tests
npm run lint            # ng lint — ESLint over src/**/*.ts and src/**/*.html
```

To build exactly as CI does for GitHub Pages (base href under `/ENTO-WEB/`):
```bash
npx ng build --base-href /ENTO-WEB/
```

Run a single test file with Vitest directly, e.g.:
```bash
npx vitest run src/app/core/services/data.service.spec.ts
```

There is no production Dockerfile — production is the static `dist/ento-web/browser` build deployed to GitHub Pages via CI (see above), not a container.

## Architecture

- **No backend, ever.** Data lives as static JSON in `public/data/` (`products.json`, `brands.json`, `groups.json`) and is fetched via `HttpClient` from `DataService` ([src/app/core/services/data.service.ts](src/app/core/services/data.service.ts)). Do not introduce API calls or server endpoints for product data — this is explicitly out of scope (see ESPECIFICACIONES.md §9).
- **SSR/prerender only for SEO.** `src/app/app.routes.server.ts` prerenders every route (`RenderMode.Prerender`). There is no live Node server serving dynamic content in production — `serve:ssr:ento-web` exists but the deployed artifact is the static `dist/ento-web/browser` output uploaded to GitHub Pages.
- **Folder structure**: `core/` (models + services, singleton/app-wide), `features/` (routed pages: `home`, `products`), `shared/components/` (reusable presentational components: product-card, product-modal, brand-carousel, header, footer, whatsapp-button). Routes are lazy-loaded via `loadComponent` in [src/app/app.routes.ts](src/app/app.routes.ts).
- **Data model** (`Brand`, `Group`, `Product` in `src/app/core/models/`): only the `chardon` brand has groups (`hasGroups: true`), and a Chardon product can belong to multiple groups at once (`groupIds.length > 1`). Business rule: when listing Chardon products with no group filter active, multi-group products must sort first (`sortChardonMultiGroupFirst` in data.service.ts) — preserve this when touching filtering/sorting.
- **Image/logo URLs** in the JSON data start with a leading `/` (domain-root-relative). `DataService` strips that leading slash (`stripLeadingSlash`) so paths resolve relative to `<base href>` instead — required because the site is deployed under `/ENTO-WEB/` on GitHub Pages, not domain root. Don't reintroduce root-absolute paths in components; always go through `DataService`'s already-normalized `products()`/`brands()` signals.
- **State**: `DataService` uses Angular signals (`signal`/`computed`), not RxJS state, as the source of truth for products/brands/groups. `firstValueFrom` is used only at the HTTP boundary. Prefer signals/computed over new Observables when extending this service.
- **Products list filtering** ([src/app/features/products/products-list.ts](src/app/features/products/products-list.ts)): filter state (`brand`, `group`, `q`) lives entirely in the URL query params (read via `toSignal(route.queryParamMap)`), not component state — this is what lets "VER MÁS" links and the home search box deep-link into a pre-filtered list. The `group` filter is only honored when `brand=chardon`. Infinite scroll is batch-based (`PAGE_SIZE = 20`) using an `IntersectionObserver` on a sentinel element, gated by `isPlatformBrowser` since this runs under SSR/prerender.
- **SEO** ([src/app/core/services/seo.service.ts](src/app/core/services/seo.service.ts)): `SeoService.update()` sets title/description/OG tags and a canonical URL per route; canonical URLs intentionally strip filter query params so `/productos?brand=x` and `/productos?brand=y` canonicalize to the same page. `setJsonLd()` injects/replaces JSON-LD script tags by id — used for `Organization` (home) and `Product`/`ItemList` (home + products list). `SITE_URL` in seo.service.ts is a placeholder domain — update it once the real production domain is known.
- **Styling**: SCSS per component (`styleUrl`), global styles/tokens in `src/styles.scss`. Design uses a black/red corporate palette (Inter + Manrope fonts).

## Conventions

- Standalone components only (no NgModules) — `imports: [...]` directly on `@Component`.
- Selectors: components `app-kebab-case`, directives `appCamelCase` (enforced by eslint.config.js).
- Prettier: single quotes, 100 print width, Angular parser for `.html` files.
