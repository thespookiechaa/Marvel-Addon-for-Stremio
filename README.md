# Marvel Addon for Stremio (v1.0.1)

An unofficial, configurable **Marvel catalog addon for Stremio**, hosted as static files on GitHub Pages. No Deno server, API keys, npm dependencies, or video streams required.

The catalog data is based on [joaogonp/addon-marvel](https://github.com/joaogonp/addon-marvel). Attribution and license details are preserved in [NOTICE-UPSTREAM.txt](NOTICE-UPSTREAM.txt). This addon is independent of the original developer's server, but the **weekly rebuild depends on the upstream GitHub repository being accessible**. If a rebuild fails, the previously published site remains available.

## Features

- MCU in chronological story order
- MCU in release order
- X-Men timeline
- Marvel movies, TV shows, and animation
- Interactive English configuration page: 6 toggles and 63 pre-generated combinations
- Stremio `movie` and `series` catalogs using IMDb identifiers, designed to work alongside your other Stremio addons
- Pagination (100 titles per page; `skip=100` and other routes)
- A web-based MCU watch-order guide showing movies and TV shows together
- Automatic weekly updates through GitHub Actions

**Note:** Stremio handles movies and TV shows as separate catalog types. The website displays the combined MCU timeline; Stremio presents separate movie and TV show rows. Ordering depends on the upstream data and may be incomplete or outdated. This addon does **not** provide streams, video files, subtitles, or links to watch copyrighted material.

## Install in Stremio

1. Open **https://thespookiechaa.github.io/Marvel-Addon-for-Stremio/**.
2. Enable the collections you want.
3. Select **Install in Stremio**, or copy the generated manifest URL.
4. If needed, open **Stremio → Addons** and paste the URL into the addon installation field.

All six collections: **https://thespookiechaa.github.io/Marvel-Addon-for-Stremio/manifest.json**

Each other combination gets its own manifest at `p/<selection>/manifest.json`. If you change your selection after installing, install the newly generated manifest as well.

## Local development on Windows

1. Install [Node.js 22 LTS or later](https://nodejs.org/).
2. Open PowerShell in the project folder.
3. Run `npm run build` to fetch and generate the full catalogs from GitHub.
4. Run `npm run preview`, then open **http://localhost:4173/**.
5. Run `npm test` to execute the automated checks (no Internet required for tests).

```powershell
npm run build
npm run preview
```

For offline local testing only, run `npm run build:demo`. **This creates a small sample catalog; do not deploy it as the full addon.**

## Deploy with GitHub Pages

This repository includes a GitHub Actions workflow to publish the generated files.

1. Keep the repository public, with its default branch named `main`.
2. Go to **Settings → Pages → Build and deployment → Source**, then choose **GitHub Actions**.
3. Open the **Actions** tab and run **Deploy Marvel Addon for Stremio**, or push a commit to `main`.
4. Check the deployment job for success and open **https://thespookiechaa.github.io/Marvel-Addon-for-Stremio/**.

The workflow runs on every push to `main` and once a week. GitHub Pages must be enabled for this repository.

## Project structure

- `scripts/build.mjs` — fetches upstream data and generates static Stremio catalogs
- `scripts/build.test.mjs` — automated tests
- `scripts/serve.mjs` — local preview server
- `site/index.html` — English configuration interface and MCU timeline
- `.github/workflows/pages.yml` — GitHub Pages CI/CD workflow
- `fixtures/catalogs.json` — sample data for local tests
- `dist/` — generated output, not committed to Git

## Limitations and acknowledgments

The upstream project owns and maintains the source listings. This builder does not use TMDb or OMDb to fill gaps. Movie and TV show names, posters, release years, and IMDb IDs come from the upstream data. Poster links may stop working, and some entries may be missing. No third-party API keys are included, extracted, or reused.

Localhost preview URLs are for development only. Use the public HTTPS GitHub Pages URL to install the addon across devices.

**Marvel, Disney, and Stremio are trademarks of their respective owners. This is an independent fan project and is not affiliated with or endorsed by them.**
