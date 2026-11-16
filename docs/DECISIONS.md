# Décisions durables

## Rôle de ce document

Ce journal conserve les choix visibles dans le code afin d'éviter qu'une nouvelle session ne réintroduise une solution incompatible par inadvertance. Il ne remplace pas le code, qui reste la source de vérité.

Le dépôt ne contenait pas d'historique de décisions formel lors du constat du 16 novembre 2026. Lorsque la raison d'origine n'est pas documentée, elle est marquée comme inconnue ou comme une déduction, et non présentée comme un fait.

## D-001 — Site multi-page sans framework applicatif

- **Statut :** en vigueur.
- **Choix :** pages HTML indépendantes, JavaScript navigateur simple, styles compilés en CSS et PHP limité aux points d'entrée serveur.
- **Raison documentée :** inconnue.
- **Effet durable :** éviter d'ajouter un framework, un bundler ou un gestionnaire de paquets pour une correction locale. Une migration d'architecture doit être une décision explicite, avec plan de déploiement et de non-régression.
- **Preuves :** absence de manifeste ; pages HTML racine ; scripts classiques dans `script/` ; `traitement.php`.

## D-002 — Navigation et pied de page partagés par fragments HTML

- **Statut :** en vigueur.
- **Choix :** `script/navb.js` récupère `nav.html` et `footer.html` avec `fetch()` et les injecte dans les pages.
- **Raison déduite :** centraliser les éléments communs sans moteur de templates serveur.
- **Conséquence :** les essais doivent passer par HTTP. Toute nouvelle page publique doit fournir les conteneurs attendus et charger le script, ou documenter pourquoi elle s'en écarte.
- **Alternative à ne pas réintroduire implicitement :** recopier manuellement la navigation dans chaque page, ce qui créerait plusieurs sources de vérité.

## D-003 — SCSS comme source des styles, CSS compilé suivi

- **Statut :** en vigueur.
- **Choix :** `style.scss` assemble les partiels de `layout/`; `style.css` et `style.css.map` sont commités et servis directement.
- **Raison déduite :** permettre un hébergement sans étape de build tout en gardant des sources de style structurées.
- **Conséquence :** une modification de style doit mettre à jour les sources SCSS et les sorties compilées dans le même changement.
- **Alternative abandonnée à éviter :** éditer uniquement `style.css`, car la recompilation écraserait la correction.

## D-004 — Contenu métier et ressources conservés dans le dépôt

- **Statut :** en vigueur.
- **Choix :** textes, horaires normaux, tarifs, coordonnées, images et polices sont référencés directement par les pages. Les annonces et horaires exceptionnels proviennent désormais du service OVH dédié.
- **Raison documentée :** inconnue.
- **Conséquence :** le dépôt est la source du contenu publié ; les changements métier nécessitent une validation explicite. Il n'existe pas de CMS ou de base de données à synchroniser dans les fichiers inspectés.
- **Alternative :** l'introduction d'un CMS ou d'une source distante n'a pas été retenue dans l'architecture actuelle et ne doit pas être faite comme simple refactorisation.

## D-005 — Envoi du contact par la fonction PHP native `mail()`

- **Statut :** en vigueur, avec limites de sécurité connues.
- **Choix :** `Contact.html` poste vers `traitement.php`, qui utilise `mail()` et redirige vers la même page avec un indicateur de résultat.
- **Raison déduite :** rester compatible avec un hébergement PHP simple sans dépendance applicative.
- **Conséquence :** le fonctionnement dépend de la configuration de l'hébergeur. Toute évolution doit préserver les noms de champs et les redirections, ou migrer formulaire et serveur ensemble.
- **Alternative actuellement non retenue :** bibliothèque SMTP ou service de formulaire externe. Elle peut être proposée pour la fiabilité/sécurité, mais seulement comme migration explicite avec gestion des secrets.

## D-006 — Services tiers chargés directement par les pages

- **Statut :** en vigueur.
- **Choix :** mesure DigitalH, Google Analytics, Google Maps, Font Awesome via cdnjs et liens Facebook sont intégrés directement dans le HTML.
- **Raison documentée :** inconnue.
- **Conséquence :** tester le rendu en cas de blocage réseau et examiner les exigences de consentement/confidentialité avant d'ajouter un nouveau traceur.
- **Alternative :** auto-héberger toutes ces ressources ou les supprimer n'a pas été décidé.

## D-007 — Invalidation de cache par suffixe de requête

- **Statut :** pratique existante, non uniformisée.
- **Choix :** plusieurs pages ajoutent des valeurs telles que `?v2.04` aux chemins CSS et JavaScript.
- **Raison déduite :** forcer les navigateurs à récupérer les ressources modifiées.
- **Conséquence :** conserver cette stratégie lors d'un changement de ressource tant qu'aucun pipeline de fichiers fingerprintés n'existe ; éviter les changements de version sans modification réelle.
- **Alternative non retenue :** noms de fichiers avec hash générés par un pipeline de build.

## D-008 — Prototype d'affichage caisse isolé

- **Statut :** expérimental/incomplet.
- **Choix :** `affichageCaisse/index.html` embarque une page déportée hébergée sur Netlify dans une iframe.
- **Raison documentée :** inconnue.
- **Conséquence :** ne pas considérer ce dossier comme une fonctionnalité de production validée ; il contient des marqueurs de conflit et aucun flux caisse réel.
- **Alternative à réévaluer avant reprise :** servir la page localement au lieu de l'URL Netlify. Aucun choix final n'est documenté.

## D-009 — Administration distante des annonces et horaires exceptionnels

- **Statut :** déployée sur OVH.
- **Choix :** un service indépendant dans `server/site-settings-api/` sert l'interface mobile et l'API publique. Prix ouvre cette interface par un lien externe ; il ne conserve ni mot de passe ni jeton OVH.
- **Raison :** permettre une modification depuis un téléphone sans exposer les données comptables de Prix, sans commit Git et sans redéploiement du site.
- **Sécurité :** base distincte, mot de passe `scrypt`, sessions de 60 jours stockées sous forme d'empreinte, cookies sécurisés, CSRF, limitation des tentatives et code de récupération à usage unique.
- **Résilience :** le site masque l'annonce distante et garde les horaires normaux lorsque l'API est indisponible.
- **Alternative écartée :** exposer toute l'application Prix sur Internet ou placer un secret d'administration dans le JavaScript public.

### Les annonces réutilisables sont des modèles explicites

- **Statut :** en vigueur.
- **Choix :** une fiche peut être enregistrée sous un nom, reprise comme brouillon non publié puis supprimée. Les dates restent visibles pour être contrôlées avant une nouvelle publication.
- **Raison :** réutiliser les fermetures et horaires récurrents sans écraser automatiquement l'annonce active ni publier d'anciennes dates par erreur.

## Pistes présentes mais actuellement désactivées

Les éléments suivants existent dans le dépôt mais ne sont pas actifs dans les pages publiques inspectées. Leur raison d'abandon n'est pas documentée ; ne pas les réactiver sans besoin fonctionnel et validation dans le navigateur.

- `script/animFonf.js` et son canvas de fond sont commentés dans les pages.
- `script/index.js` n'est référencé que dans un bloc commenté.
- `script/ouverture.js` n'est chargé par aucune page inspectée et ses horaires diffèrent de ceux affichés sur l'accueil.
- `Contact.php` duplique partiellement la page contact mais ne définit pas l'action du formulaire et expose `phpinfo()` ; la navigation utilise `Contact.html`.
- Les liens vers des mentions légales/CGV dans `footer.html` sont commentés et les fichiers cibles n'existent pas.

## Décisions encore nécessaires

- Définir et documenter le déploiement réel du site principal.
- Décider si les outils de diagnostic/test PHP doivent être exclus de la publication.
- Décider du statut final de l'affichage caisse.
- Définir une source et une procédure fiables pour les horaires normaux et exceptionnels.
- Choisir une stratégie de sécurisation du formulaire et de conformité des services de mesure.
