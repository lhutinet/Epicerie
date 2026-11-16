# Mémoire de travail — Épicerie Proxi Roussillon

## Objectif du projet

Ce dépôt contient le site vitrine de l'Épicerie Proxi de Roussillon (38150). Il présente le commerce, ses produits, ses services, ses horaires et ses coordonnées. Un formulaire de contact PHP envoie les messages par courriel. Un prototype séparé, `affichageCaisse/`, concerne un affichage déporté de caisse.

Le code existant et les informations commerciales publiées dans les pages restent la source de vérité. Le cahier des charges historique se trouve dans `CDC.txt`, mais il ne prévaut pas sur le comportement courant du code.

## Règles de modification

- Lire d'abord `docs/ARCHITECTURE.md`, `docs/ETAT_PROJET.md` et `docs/DECISIONS.md`.
- Préserver les changements locaux de l'utilisateur. Avant toute modification, exécuter `git status --short --branch` et examiner le diff des fichiers concernés.
- Faire des changements petits et ciblés. Ne pas réécrire une page entière pour une correction locale.
- Ne pas modifier les textes métier, prix, horaires, coordonnées, liens sociaux ou identifiants de mesure sans source explicite ou confirmation de l'utilisateur.
- Conserver les fichiers en UTF-8 et vérifier les accents dans un navigateur après modification.
- Pour le style, modifier `style.scss` ou les partiels de `layout/`, puis régénérer `style.css` et `style.css.map`. Ne pas corriger uniquement le CSS compilé.
- Si une ressource statique change, vérifier les suffixes de cache `?v...` utilisés par les pages ; ne les incrémenter que lorsque c'est utile.
- Ne pas installer de dépendance sans demande explicite. Aucun manifeste de dépendances n'est actuellement présent.
- Ne pas corriger au passage les problèmes recensés dans `docs/ETAT_PROJET.md` sauf s'ils font partie de la demande.

## Fichiers importants

- `index.html` : page d'accueil, horaires et logique de période exceptionnelle.
- `nosProduit.html`, `services.html`, `Contact.html` : principales pages publiques.
- `nav.html`, `footer.html` : fragments communs chargés par JavaScript.
- `script/navb.js` : injection des fragments et comportement du menu mobile/desktop.
- `script/horloge.js`, `script/anim001.js` : horloge décorative et animations actives.
- `traitement.php` : réception du formulaire et envoi par `mail()`.
- `style.scss`, `layout/*.scss` : sources des styles.
- `style.css`, `style.css.map` : sorties compilées suivies par Git.
- `img/`, `font/` : ressources locales publiées avec le site.
- `affichageCaisse/` : prototype distinct d'affichage déporté, actuellement incomplet.
- `CDC.txt` : besoins et contenus historiques, non contractuels lorsqu'ils divergent du code.
- `docs/ARCHITECTURE.md` : carte technique du dépôt.
- `docs/ETAT_PROJET.md` : état connu, limites et travaux restants.
- `docs/DECISIONS.md` : choix durables et pistes actuellement écartées.

## Conventions de code

- HTML multi-page sans framework ; chemins relatifs depuis la racine du site.
- Contenu visible en français. Conserver les balises sémantiques, les attributs `alt`, les métadonnées et le comportement responsive.
- JavaScript navigateur simple, sans bundler et sans modules. Tester l'absence d'un élément avant de le manipuler lorsqu'un script peut être partagé par plusieurs pages.
- SCSS réparti par responsabilité dans `layout/` et assemblé par `style.scss`.
- PHP procédural minimal. Toute donnée reçue doit être validée côté serveur ; ne jamais faire confiance au seul contrôle HTML.
- Le formatage historique varie selon les fichiers (tabulations ou espaces). Respecter le style du fichier touché et éviter les reformattages globaux.
- Les identifiants HTML doivent être uniques et les liens d'ancrage doivent viser un identifiant existant.

## Commandes de vérification

Le dépôt ne contient ni suite de tests automatisés ni configuration de CI. Exécuter les contrôles pertinents depuis la racine du dépôt.

```powershell
# État et diff avant/après intervention
git status --short --branch
git diff --check

# Syntaxe JavaScript
Get-ChildItem .\script -Filter *.js | ForEach-Object { node --check $_.FullName }

# Syntaxe PHP : utiliser le PATH, sinon la version Wamp la plus récente trouvée
$php = (Get-Command php.exe -ErrorAction SilentlyContinue).Source
if (-not $php) {
    $php = (Get-ChildItem 'D:\wamp64\bin\php\php*\php.exe' |
        Sort-Object FullName -Descending |
        Select-Object -First 1).FullName
}
Get-ChildItem -File -Filter *.php | ForEach-Object { & $php -n -l $_.FullName }

# Vérification de compilation SCSS, si Sass CLI est installé, sans écraser les fichiers suivis
sass.cmd --no-source-map .\style.scss "$env:TEMP\epicerie-style-check.css"

# Serveur local : nécessaire car nav.html et footer.html sont chargés avec fetch()
& $php -S 127.0.0.1:8000 -t .
```

Vérification manuelle minimale dans un navigateur :

- ouvrir `http://127.0.0.1:8000/index.html`, `nosProduit.html`, `services.html` et `Contact.html` ;
- contrôler navigation, pied de page, ancres, images, console navigateur et responsive mobile/desktop ;
- ne pas soumettre le formulaire contre une boîte réelle pendant un simple test ;
- vérifier séparément les changements d'horaires avec des dates contrôlées.

## Limites de sécurité

- Ne jamais ajouter de secret, mot de passe, jeton, donnée client ou courriel reçu au dépôt.
- Ne pas exécuter `test_mail.php` ni soumettre le formulaire réel sans autorisation : ces actions peuvent envoyer un courriel externe.
- Ne pas appeler `purge_cache.php` sur un environnement hébergé sans connaître précisément son effet.
- `info.php` et `Contact.php` exposent actuellement `phpinfo()` ; ne pas étendre cette exposition et consulter `docs/ETAT_PROJET.md` avant tout déploiement.
- Ne pas supposer que les services externes (mesure d'audience, Google Maps, CDN Font Awesome, Facebook, Netlify) sont disponibles ou autorisés : prévoir le comportement en cas d'échec.
- Ne pas publier de changement d'horaires, de prix ou de contact sans validation métier.
- Ne pas effectuer d'action destructive sur les images, polices ou fichiers suivis sans inventaire et accord explicite.

## Règles Git

- Branche suivie lors du dernier constat : `master`, liée à `origin/master`.
- Le dépôt peut contenir des modifications locales préexistantes ; ne jamais les écraser, les restaurer ou les inclure implicitement.
- Examiner `git diff -- <fichier>` avant de modifier un fichier déjà changé.
- Ne pas utiliser `git reset --hard`, `git clean`, `git checkout --` ou équivalent destructif sans demande explicite.
- Ne créer ni commit, ni tag, ni branche sans demande explicite de l'utilisateur.
- **Le push automatique est interdit.** Un commit demandé ne vaut jamais autorisation de pousser. Un `git push` exige une demande explicite et distincte de l'utilisateur dans la conversation en cours.
- Ne pas supposer qu'un push déclenche un déploiement : aucun pipeline de déploiement n'est documenté dans ce dépôt.
