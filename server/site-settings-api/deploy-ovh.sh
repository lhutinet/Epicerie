#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"
umask 077

if [ ! -f .env ]; then
  database_password="$(openssl rand -hex 24)"
  {
    printf 'DATABASE_URL=postgresql://epicerie_site:%s@umami-db:5432/epicerie_site\n' "$database_password"
    printf 'PUBLIC_URL=https://horaires.digitalh.fr\n'
    printf 'PUBLIC_ORIGINS=https://epicerie.roussillon38.fr,https://www.epicerie.roussillon38.fr\n'
    printf 'COOKIE_SECURE=true\n'
  } > .env
else
  database_password="$(sed -n 's#^DATABASE_URL=postgresql://epicerie_site:\([^@]*\)@.*#\1#p' .env)"
fi

if [ ! -f .admin-token ]; then
  openssl rand -hex 32 > .admin-token
fi
if [ ! -f .setup-token ]; then
  openssl rand -hex 32 > .setup-token
fi
bootstrap_token="$(cat .admin-token)"
setup_token="$(cat .setup-token)"
case "$bootstrap_token" in
  ''|*[!0-9a-f]*)
    echo 'Jeton d’amorçage absent ou invalide.' >&2
    exit 1
    ;;
esac
if [ "${#bootstrap_token}" -ne 64 ]; then
  echo 'Jeton d’amorçage absent ou invalide.' >&2
  exit 1
fi
case "$setup_token" in
  ''|*[!0-9a-f]*)
    echo 'Code d’installation absent ou invalide.' >&2
    exit 1
    ;;
esac
if [ "${#setup_token}" -ne 64 ]; then
  echo 'Code d’installation absent ou invalide.' >&2
  exit 1
fi
if grep -q '^ADMIN_BOOTSTRAP_TOKEN=' .env; then
  sed -i "s/^ADMIN_BOOTSTRAP_TOKEN=.*/ADMIN_BOOTSTRAP_TOKEN=$bootstrap_token/" .env
else
  printf 'ADMIN_BOOTSTRAP_TOKEN=%s\n' "$bootstrap_token" >> .env
fi
if grep -q '^INITIAL_SETUP_TOKEN=' .env; then
  sed -i "s/^INITIAL_SETUP_TOKEN=.*/INITIAL_SETUP_TOKEN=$setup_token/" .env
else
  printf 'INITIAL_SETUP_TOKEN=%s\n' "$setup_token" >> .env
fi
chmod 600 .env .admin-token .setup-token

case "$database_password" in
  ''|*[!0-9a-f]*)
    echo 'Mot de passe DATABASE_URL absent ou invalide.' >&2
    exit 1
    ;;
esac

postgres_user="$(docker exec umami-db printenv POSTGRES_USER)"
postgres_database="$(docker exec umami-db printenv POSTGRES_DB)"

if ! docker exec umami-db psql -U "$postgres_user" -d "$postgres_database" -tAc "SELECT 1 FROM pg_roles WHERE rolname='epicerie_site'" | grep -q 1; then
  docker exec umami-db psql -v ON_ERROR_STOP=1 -U "$postgres_user" -d "$postgres_database" -c "CREATE ROLE epicerie_site LOGIN PASSWORD '$database_password'"
else
  docker exec umami-db psql -v ON_ERROR_STOP=1 -U "$postgres_user" -d "$postgres_database" -c "ALTER ROLE epicerie_site PASSWORD '$database_password'"
fi

if ! docker exec umami-db psql -U "$postgres_user" -d "$postgres_database" -tAc "SELECT 1 FROM pg_database WHERE datname='epicerie_site'" | grep -q 1; then
  docker exec umami-db psql -v ON_ERROR_STOP=1 -U "$postgres_user" -d "$postgres_database" -c "CREATE DATABASE epicerie_site OWNER epicerie_site"
fi

docker exec -e PGPASSWORD="$database_password" -i umami-db \
  psql -v ON_ERROR_STOP=1 -U epicerie_site -d epicerie_site < schema.sql
docker compose up -d --build

echo 'Service déployé. Conservez .admin-token uniquement sur le serveur.'
echo 'Le code de première installation se trouve dans .setup-token et devient inutilisable après configuration.'
