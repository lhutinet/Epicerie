# API des horaires du site Épicerie

Ce service fournit une annonce publique au site de l'Épicerie et une interface d'administration mobile protégée. Il est séparé de Monmail : base PostgreSQL, mot de passe, sessions et jeton d'amorçage distincts.

## Fonctions

- `GET /announcement` : annonce publique active, sans donnée d'administration ;
- `/admin/` : interface mobile de gestion ;
- mot de passe stocké avec `scrypt` et sel aléatoire ;
- sessions persistantes de 60 jours, révocables appareil par appareil ;
- récupération par code unique de 128 bits ;
- limitation des tentatives de connexion et de récupération ;
- protection CSRF, cookie `Secure`, `HttpOnly` pour la session et `SameSite=Strict` ;
- disparition automatique de l'annonce en dehors de sa période.

## Vérifications locales

```powershell
npm.cmd run check
npm.cmd test
```

Les tests du module `core.js` n'ont pas besoin de PostgreSQL. Le serveur complet exige `DATABASE_URL`, le schéma SQL et la dépendance `pg`.

## Déploiement OVH proposé

Le sous-domaine proposé est `horaires.digitalh.fr`. Il doit être confirmé dans le DNS avant activation du certificat.

1. Copier ce dossier sur le VPS dans un répertoire privé.
2. Exécuter `chmod +x deploy-ovh.sh && ./deploy-ovh.sh`.
3. Installer `horaires.digitalh.fr.nginx` dans la configuration Nginx.
4. Tester `http://horaires.digitalh.fr/health`.
5. Activer HTTPS avec Certbot, puis vérifier `https://horaires.digitalh.fr/health`.
6. Ouvrir `/admin/`, saisir le code temporaire contenu dans `.setup-token`, puis choisir directement le premier mot de passe.

Le code `.setup-token` ne permet la création du compte que tant qu'aucun mot de passe n'existe. Le mot de passe n'est donc jamais transmis à la personne qui déploie le service. Après installation, conserver ou supprimer `.setup-token` selon la procédure d'exploitation ; sa valeur est refusée par l'API dès que le compte existe.

En dernier recours seulement, l'administrateur du VPS peut réinitialiser le compte avec `.admin-token`. Éviter de conserver le mot de passe dans l'historique du shell :

```sh
read -r -s -p 'Nouveau mot de passe : ' admin_password
printf '\n'
bootstrap_token="$(cat .admin-token)"
payload="$(ADMIN_PASSWORD="$admin_password" python3 -c 'import json,os; print(json.dumps({"password": os.environ["ADMIN_PASSWORD"]}))')"
curl --fail --silent --show-error \
  -H "Authorization: Bearer $bootstrap_token" \
  -H 'Content-Type: application/json' \
  --data "$payload" \
  https://horaires.digitalh.fr/admin/bootstrap
unset admin_password payload bootstrap_token
```

La réponse contient un nouveau code de récupération. Il doit être copié immédiatement dans un gestionnaire de mots de passe. L'API ne pourra pas l'afficher une seconde fois.

Si mot de passe et code de récupération sont tous deux perdus, relancer la route d'amorçage depuis le VPS avec `.admin-token`. Cette opération remplace le mot de passe, produit un nouveau code et révoque toutes les sessions.

## Secrets et sauvegarde

- `.env`, `.admin-token` et `.setup-token` ne doivent jamais entrer dans Git ni être copiés dans Prix ou dans le site public.
- PostgreSQL n'est pas exposé sur Internet ; seul Nginx contacte le port local `127.0.0.1:3002`.
- Sauvegarder la base `epicerie_site` avec les sauvegardes PostgreSQL du VPS.
- Une modification de `PUBLIC_URL` exige une reconnexion, car les cookies restent limités à leur hôte.
