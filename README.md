# Marvel Addon for Stremio (v1.0)

Addon de catalogues Marvel en français, **hébergé en fichiers statiques** via GitHub Pages : pas de serveur Deno, aucune clé API, aucune dépendance npm, aucun lien de streaming pirate.

D'après les données du projet [joaogonp/addon-marvel](https://github.com/joaogonp/addon-marvel), avec attribution conservée dans `NOTICE-UPSTREAM.txt`. Il est indépendant du serveur du créateur, mais le **build hebdomadaire dépend de l'accessibilité du dépôt source**. Si le build échoue, la dernière version publiée reste disponible.

## Fonctionnalités
- MCU dans l'ordre chronologique ; MCU par date de sortie ; X-Men ; films ; séries ; animations
- Page de configuration en français : 6 interrupteurs, 63 combinaisons pré-générées
- Catalogues de type `movie` / `series` avec identifiants IMDb, compatibles avec les autres addons Stremio
- Pagination de 100 éléments (routes `skip=100`, etc.)
- Guide MCU sur la page web reprenant le mélange films/séries dans l'ordre de la source
- Mises à jour automatiques hebdomadaires via GitHub Actions

**Important :** Stremio distingue les catalogues de films et de séries ; la chronologie globale est présentée sur la page web, alors que dans Stremio elle est scindée en deux lignes, une par type. Les films/séries sont classés selon la source, sans garantie d'exhaustivité ni de fraîcheur. Cet addon ne fournit ni vidéos, ni flux, ni sous-titres.

## Développer sur Windows

1. Installer [Node.js 22 LTS ou une version plus récente](https://nodejs.org/).
2. Ouvrir PowerShell dans ce dossier.
3. Exécuter `npm run build` pour charger les catalogues complets depuis GitHub.
4. Exécuter `npm run preview`, puis ouvrir `http://localhost:4173/`.
5. Exécuter `npm test` pour les contrôles automatiques (pas besoin d'Internet).

On peut aussi exécuter `npm run build:demo` **sans Internet**, mais ce mode ne contient qu'un petit jeu de données. Ne pas le publier comme catalogue complet.

**PowerShell :**
```powershell
npm run build
npm run preview
```

## Publier gratuitement sur GitHub Pages

1. Créer un dépôt GitHub public nommé par exemple `Marvel-Addon-for-Stremio`.
2. Y envoyer **tout ce dossier** à la racine (y compris `.github/workflows/pages.yml`).
3. Vérifier que la branche principale s'appelle `main`.
4. Dans **Settings > Pages > Build and deployment**, sélectionner **GitHub Actions**.
5. Dans l'onglet **Actions**, exécuter **Déployer Marvel Addon for Stremio** (ou provoquer un push sur `main`).
6. Accéder à `https://thespookiechaa.github.io/Marvel-Addon-for-Stremio/`.
7. Sélectionner les catalogues sur la page et copier le lien `https://.../manifest.json` vers **Stremio > Addons > Ajouter un addon via URL**. Ou essayer le bouton d'installation directe.

La branche `main` peut être protégée, mais GitHub Pages doit être autorisé dans le dépôt. GitHub Pages d'un dépôt privé dépend des règles d'abonnement GitHub ; le dépôt public est le plus simple.

## Structure

- `scripts/build.mjs` : lit les listes originales et génère les catalogues statiques
- `site/index.html` : configuration et guide chronologique
- `.github/workflows/pages.yml` : publication GitHub Pages
- `fixtures/catalogs.json` : données miniatures destinées aux tests/démos
- `dist/` : dossier généré (non versionné)

## Limites

La source reste éditée par son auteur, et le générateur n'utilise pas TMDB pour compléter les éléments. Le titre, le poster, l'année et l'identifiant IMDb proviennent des données d'origine. Certaines affiches peuvent expirer. Les données sources sont publiées avec la licence dans `NOTICE-UPSTREAM.txt` ; aucune clé API n'est extraite ou incluse.

Un serveur local fonctionne pour le développement sur le PC, mais n'est pas l'URL d'installation destinée aux autres appareils. Utiliser l'URL GitHub Pages en HTTPS.