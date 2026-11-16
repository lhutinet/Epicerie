# État du projet

## Portée du constat

État établi le 16 novembre 2026 par inspection ciblée du code et de Git, puis complété par l'implémentation locale de la gestion des horaires. Aucun test en navigateur contre la production ni envoi de formulaire n'a été effectué. « Fonctionne » signifie ici que le chemin d'exécution est présent et contrôlé localement ; cela ne confirme ni l'état de l'hébergement ni celui des services tiers.

Le dépôt était sur `master`, aligné sur `origin/master`, au début de l'implémentation des horaires distants.

## Ce qui fonctionne actuellement dans le code

- Les pages principales d'accueil, produits, services et contact sont présentes et reliées par la navigation.
- `script/navb.js` charge les fragments communs `nav.html` et `footer.html` par HTTP et gère le menu hamburger.
- Les pages utilisent le CSS compilé `style.css`, avec des règles responsive dans les sources SCSS.
- La page produits active ses animations à l'apparition via `IntersectionObserver`.
- L'accueil dessine une horloge locale en canvas.
- L'accueil peut afficher une information, une fermeture ou des horaires exceptionnels reçus de l'API OVH sans masquer les horaires normaux.
- Le service dédié fournit une interface mobile, un mot de passe distinct, des sessions révocables de 60 jours et une récupération par code unique. Les tests locaux de validation, de mot de passe et d'expiration passent.
- L'administration peut mémoriser, reprendre et supprimer des modèles d'information, de fermeture ou d'horaires ; la sécurité du compte est repliée par défaut pour alléger l'écran mobile.
- Le formulaire de `Contact.html` poste les champs attendus vers `traitement.php`, qui tente un envoi par `mail()` puis redirige vers un message de succès ou d'erreur.
- Les images et polices nécessaires sont conservées localement ; Font Awesome, la carte et la mesure d'audience sont externes.

## Éléments terminés ou largement couverts

Par comparaison entre `CDC.txt` et les pages actuelles, les blocs éditoriaux suivants sont présents :

- présentation du commerce, adresse, téléphone et horaires ;
- produits locaux, produits du terroir, coupe et rayons courants ;
- livraison à domicile, dépôt de pain et bouteilles de gaz ;
- formulaire de contact, carte et lien Facebook.

Cette liste décrit la couverture fonctionnelle visible, pas une validation métier récente du contenu.

## Ce qui reste à faire

- Confirmer le mécanisme réel d'hébergement et de déploiement du site principal, puis le documenter.
- Mettre en place une validation automatisée minimale pour HTML, liens, JavaScript, SCSS et PHP, ou documenter l'outil externe retenu.
- Compléter ou retirer `Actualites.html` et `indispensables.html`, qui contiennent actuellement peu de contenu ou des placeholders.
- Décider du devenir de `affichageCaisse/` : prototype à terminer, à isoler ou à supprimer dans une tâche dédiée.
- Clarifier le statut de `Contact.php`, `info.php`, `purge_cache.php`, `test.html`, `test_mail.php` et des scripts non chargés.
- Maintenir le service `server/site-settings-api/` désormais déployé sur OVH avec DNS, HTTPS et compte administrateur actifs.
- Vérifier en production le CORS depuis le ou les domaines réels du site Épicerie.
- Confirmer si les pages Actualités et Indispensables doivent être accessibles depuis la navigation principale.

## Problèmes connus

### Bloquants ou visibles

- `affichageCaisse/affichageDeporte/index.html` contient des marqueurs de conflit Git (`<<<<<<<`, `=======`, `>>>>>>>`) déjà suivis dans `HEAD`. Son CSS est invalide tant que le conflit n'est pas résolu.
- Les liens de l'accueil visent `services.html#ancreLivraison`, `#ancrePain` et `#ancreGaz`, tandis que la page déclare `#livraison`, `#pain` et `#gaz`.

### Qualité et robustesse

- Plusieurs identifiants HTML sont encore dupliqués : notamment `BanderoleFb` dans l'accueil, `---` dans `indispensables.html`, ainsi que certains identifiants d'images dans `nosProduit.html`.
- Le script d'invalidation du cache dans `index.html` cherche l'élément `#css`, mais la balise `<link>` n'a pas cet identifiant.
- Le lien téléphonique de `services.html` utilise `+0474864064`, format international probablement incorrect ; la valeur métier doit être confirmée avant correction.
- Il n'existe ni `.gitignore`, ni `.gitattributes`, ni README, ni manifeste de dépendances, ni pipeline CI dans le dépôt inspecté.
- Aucun test automatisé n'est présent. `test.html` et `test_mail.php` sont des essais manuels, pas une suite de non-régression.
- Les versions de cache des ressources ne sont pas uniformes entre les pages.

### Sécurité et exploitation

- `info.php` et `Contact.php` appellent `phpinfo()`, ce qui peut divulguer la configuration du serveur s'ils sont publiquement accessibles.
- `test_mail.php` contient une adresse destinataire réelle et déclenche un courriel lorsqu'il est appelé.
- `purge_cache.php` ne comporte ni authentification ni contrôle d'accès.
- `traitement.php` ne met en œuvre ni protection CSRF, ni limitation de débit, ni anti-spam. L'adresse fournie par l'utilisateur est placée dans les en-têtes de courriel sans contrôle strict contre l'injection d'en-têtes.
- Le formulaire dépend entièrement de la configuration `mail()` de l'hébergeur ; aucune journalisation ou solution de repli n'est prévue.
- Les scripts de mesure, la carte, Font Awesome et Facebook dépendent de services tiers et peuvent affecter confidentialité, disponibilité ou politique de cookies. Aucune gestion du consentement n'a été repérée dans les fichiers inspectés.

## Limitations actuelles

- Les horaires normaux restent codés en dur ; seules les informations et périodes exceptionnelles sont administrables à distance.
- Le service OVH, le DNS et HTTPS sont déployés ; la publication du JavaScript du site reste nécessaire pour livrer les évolutions d'affichage sur le domaine public.
- L'architecture de fragments chargés avec `fetch()` exige un serveur HTTP ; elle ne fonctionne pas de façon fiable par simple double-clic sur les fichiers.
- Le site n'a pas de couche de données, d'administration, de traduction ni de gestion centralisée du contenu.
- La réussite du contact ne peut pas être garantie hors de l'environnement PHP configuré.
- Le mode de déploiement, le domaine effectivement servi et la correspondance entre GitHub, l'hébergement principal et Netlify restent non documentés.
