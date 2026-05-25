#!/bin/sh
set -eu

wait_for_mysql() {
  if [ "${DB_ADAPTER:-mysql}" != "mysql" ]; then
    return 0
  fi

  echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
  attempt=0
  while [ "$attempt" -lt 30 ]; do
    if php -r "
      \$dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        getenv('DB_HOST') ?: 'mysql',
        getenv('DB_PORT') ?: '3306',
        getenv('DB_NAME') ?: 'nene_corpus',
        getenv('DB_CHARSET') ?: 'utf8mb4',
      );
      new PDO(\$dsn, getenv('DB_USER') ?: '', getenv('DB_PASSWORD') ?: '');
    " 2>/dev/null; then
      echo "MySQL is ready."
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 2
  done

  echo "MySQL did not become ready in time." >&2
  exit 1
}

composer install --no-interaction --prefer-dist
wait_for_mysql

mkdir -p storage/uploads/hero var
chown -R www-data:www-data storage var
chmod -R 775 storage var

if [ "${NENE_CORPUS_SKIP_MIGRATE:-0}" != "1" ]; then
  composer migrations:migrate || true
fi

exec apache2-foreground
