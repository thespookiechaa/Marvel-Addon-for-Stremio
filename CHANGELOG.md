# Changelog

Notable updates to **Marvel Addon for Stremio**. The addon is an independent, unofficial fan project.

## [1.2.0] — 2026-10-23

### Added
- **WandaVision (2021)** in the **Road to Doomsday** watch order, immediately after *Avengers: Endgame* and before *Loki*.
- Road to Doomsday now includes **16 titles: 14 movies and 2 TV series**.
- Both **WandaVision** and **Loki** are available in the Road to Doomsday series catalog within Stremio.
- Extended automated tests for the new watch order, series catalog contents, and live site text.

### Updated
- Site headline, title count, and watchlist progress indicators.
- Addon manifest version and package version to **1.2.0**.
- Browser stylesheet cache marker for the existing Doom-inspired green and metal design.
- English documentation and GitHub release notes.

### Compatibility
- **No reinstall required to keep using the same catalog selection URLs.** The original catalog and manifest addresses are preserved.
- **Road to Doomsday only:** https://thespookiechaa.github.io/Marvel-Addon-for-Stremio/p/64/manifest.json
- **All seven collections:** https://thespookiechaa.github.io/Marvel-Addon-for-Stremio/p/127/manifest.json
- The website displays a combined movie/series watchlist, while Stremio displays one movie row and one TV series row due to Stremio's catalog type requirements.
- Watched-title progress is stored in the browser using IMDb identifiers; marking existing items as watched is retained across this update.

## [1.1.0] — 2026-10-23

- Introduced the **Road to Doomsday** curated watchlist and theater release countdown for France and the United States.
- Added a mixed-format watchlist on the website and separate compatible Stremio movie and series catalogs.
- Added locally saved watched-title progress and the green, metallic Doom-themed event interface.
- Expanded configuration options to **7 collections and 127 combinations**.

## [1.0.1] — 2026-10-23

- Translated the configuration website, addon catalog titles, descriptions, and project documentation into English.
