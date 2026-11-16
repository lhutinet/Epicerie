# Architecture du projet

## Vue d'ensemble

Le projet est un site vitrine multi-page principalement statique. Il n'utilise pas de framework applicatif, de bundler ni de gestionnaire de dépendances identifié dans le dépôt. Les pages HTML, les ressources, le JavaScript navigateur et le CSS compilé peuvent être servis directement par un serveur HTTP. PHP est requis uniquement pour les points d'entrée serveur et notamment le formulaire de contact.

Cette description repose sur une découverte ciblée du dépôt au 16 novembre 2026. Aucun README, manifeste de dépendances, pipeline CI/CD ou fichier de configuration d'hébergement n'était présent.

## Structure réelle

```text
Epicerie/
├── index.html                  accueil et horaires
├── nosProduit.html            catalogue éditorial des produits
├── services.html              livraison, pain et gaz
├── Contact.html               formulaire public actif
├── indispensables.html        page de contenu encore partielle
├── Actualites.html            squelette de page d'actualités
├── nav.html                   fragment de navigation partagé
├── footer.html                fragment de pied de page partagé
├── traitement.php             traitement serveur du formulaire
├── Contact.php                ancienne/alternative page PHP, statut à confirmer
├── info.php                   diagnostic phpinfo()
├── purge_cache.php            suppression de fichiers cache/*.cache
├── test.html                  essai manuel de copie dans le presse-papiers
├── test_mail.php              essai manuel d'envoi de courriel réel
├── style.scss                 point d'entrée SCSS
├── layout/                    partiels SCSS par zone fonctionnelle
├── style.css                  CSS compilé et servi aux pages
├── style.css.map              source map compilée
├── script/                    scripts navigateur sans bundler
├── img/                       images éditoriales et commerciales
├── font/                      polices locales
├── affichageCaisse/           prototype d'affichage déporté
└── CDC.txt                    cahier de contenus historique
```

`style.css` et `style.css.map` sont des fichiers générés mais suivis par Git. Les dossiers `img/` et `font/` contiennent des ressources publiées ; ils ne constituent pas des dépendances à analyser comme du code.

## Pages et modules principaux

### Pages publiques

- `index.html` compose l'accueil, une présentation, les horaires normaux/exceptionnels et une horloge dessinée en canvas.
- `nosProduit.html` décrit les produits locaux, du terroir, à la coupe et les rayons quotidiens.
- `services.html` décrit la livraison à domicile, le dépôt de pain et les bouteilles de gaz.
- `Contact.html` publie le formulaire qui envoie une requête POST à `traitement.php`.
- `indispensables.html` et `Actualites.html` existent, mais leur contenu est incomplet et elles ne figurent pas dans la navigation principale actuelle.

### Fragments partagés et JavaScript

Chaque page active contient des conteneurs `#navbar` et `#footer`. `script/navb.js` charge `nav.html` et `footer.html` avec `fetch()`, injecte leur contenu, puis initialise le menu hamburger. Cette architecture impose un accès par HTTP ; l'ouverture directe en `file://` peut bloquer les chargements.

Les autres scripts ont des responsabilités isolées :

- `script/horloge.js` dessine et actualise l'horloge de l'accueil ;
- `script/anim001.js` utilise `IntersectionObserver` pour révéler certains contenus ;
- `script/index.js`, `script/ouverture.js` et `script/animFonf.js` existent mais ne sont pas chargés par les pages publiques inspectées, ou seulement dans des blocs commentés ;
- aucun état applicatif persistant ni appel d'API métier actif n'a été trouvé.

### Styles

`style.scss` importe les partiels de `layout/` : variables et polices, réglages globaux, tailles d'images, navigation, contenu principal, pied de page et contact. La sortie publiée est `style.css`, avec `style.css.map`. Les pages utilisent parfois un suffixe de requête (`?v2.04`, par exemple) pour invalider le cache.

### Traitement PHP

`traitement.php` lit les champs POST du formulaire, construit un message texte, appelle la fonction PHP native `mail()`, puis redirige vers `Contact.html?success=1` ou `Contact.html?error=1`. Il n'y a ni base de données, ni stockage local des messages, ni bibliothèque d'envoi de courriel dans le dépôt.

`Contact.php`, `info.php`, `purge_cache.php` et `test_mail.php` sont aussi accessibles comme points d'entrée si le serveur publie toute la racine. Leur statut de déploiement n'est pas documenté. Ils doivent être considérés avec prudence, notamment parce que les deux premiers exposent `phpinfo()` et que `test_mail.php` tente un envoi réel.

### Affichage caisse

`affichageCaisse/index.html` embarque dans une iframe une URL Netlify pointant vers `affichageCaisse/affichageDeporte/`. La page locale déportée n'est qu'un prototype et contient des marqueurs de conflit Git suivis. Aucun échange avec un logiciel de caisse ou flux de données n'est implémenté dans les fichiers inspectés.

## Données et services externes

Les données métier sont codées directement dans les pages : textes, horaires, tarifs, coordonnées et chemins d'images. Aucun schéma de données, base ou fichier de configuration métier séparé n'a été identifié.

Services externes référencés :

- `stat.digitalh.fr` pour une mesure d'audience ;
- Google Tag Manager/Google Analytics avec l'identifiant présent dans les pages ;
- Google Maps pour le lien et la carte intégrée du pied de page ;
- le CDN cdnjs pour Font Awesome ;
- Facebook pour la page du commerce ;
- `digitalh.fr` pour le lien du créateur ;
- `epicerie-roussillon.netlify.app` pour le prototype d'affichage caisse ;
- le service de messagerie configuré côté hébergeur PHP via `mail()`.

Ces intégrations sont toutes effectuées côté navigateur, sauf l'envoi de courriel. Leur disponibilité et leurs règles de confidentialité ne sont pas contrôlées par ce dépôt.

## Déploiement

Le dépôt Git pointe vers `origin` sur GitHub et suit `origin/master`. Cela décrit le stockage du code, pas le mécanisme de mise en production.

Aucun workflow `.github`, Dockerfile, manifeste Netlify, script de publication ou configuration d'hébergeur n'a été trouvé. Le mode de déploiement du site principal est donc **inconnu**. La présence de PHP et de références de courriel du domaine suggère un hébergement HTTP/PHP classique, mais cette hypothèse n'est pas suffisamment documentée pour être traitée comme un fait.

Pour un déploiement complet, l'hébergement doit au minimum :

- servir la racine et les ressources avec leurs chemins relatifs ;
- exécuter PHP pour `traitement.php` ;
- fournir et configurer `mail()` si le formulaire doit fonctionner ;
- autoriser les accès sortants nécessaires aux services tiers ;
- éviter d'exposer les points d'entrée de diagnostic et de test mentionnés plus haut.

La relation entre un push GitHub et la production n'est pas connue. Ne jamais déclencher ou promettre un déploiement à partir d'un push sans confirmation externe.
