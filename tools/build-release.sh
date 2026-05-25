#!/usr/bin/env bash
# Build a Tier A release ZIP — vendor bundled, frontend assets in public_html/.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

NENE2_DIR="${NENE2_DIR:-$(dirname "$ROOT")/NENE2}"
BUILD_DIR="${RELEASE_BUILD_DIR:-$ROOT/build/release}"
STAGING_DIR="$BUILD_DIR/staging/nene-corpus"
VERSION="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo dev)"
ZIP_PATH="${RELEASE_ZIP:-$BUILD_DIR/nene-corpus-${VERSION}.zip}"

echo "==> NeNe Corpus release build (${VERSION})"

if [[ ! -f "$NENE2_DIR/composer.json" ]]; then
  echo "error: NENE2 not found at ${NENE2_DIR}. Clone it as a sibling or set NENE2_DIR." >&2
  exit 1
fi

echo "==> Install PHP dependencies (production)"
composer install --no-interaction --no-dev --prefer-dist --optimize-autoloader

echo "==> Build frontend (admin → public_html/admin, widget → public_html/)"
(
  cd frontend
  npm ci
  npm run build:release
)

required_paths=(
  public_html/index.php
  public_html/install/index.html
  public_html/admin/index.html
  public_html/admin/.htaccess
  public_html/widget.js
  public_html/widget.css
  vendor/autoload.php
)

for path in "${required_paths[@]}"; do
  if [[ ! -e "$ROOT/$path" ]]; then
    echo "error: missing required release artifact: $path" >&2
    exit 1
  fi
done

echo "==> Stage release tree"
rm -rf "$BUILD_DIR/staging"
mkdir -p "$STAGING_DIR" "$STAGING_DIR/var" "$STAGING_DIR/storage/uploads"

rsync -a \
  --exclude='.git/' \
  --exclude='.github/' \
  --exclude='.cursor/' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='.phpunit.cache/' \
  --exclude='.phpunit.result.cache' \
  --exclude='.phpstan.cache/' \
  --exclude='.php-cs-fixer.cache' \
  --exclude='build/' \
  --exclude='docker/' \
  --exclude='frontend/' \
  --exclude='node_modules/' \
  --exclude='tests/' \
  --exclude='var/*' \
  --exclude='storage/uploads/*' \
  "$ROOT/" "$STAGING_DIR/"

touch "$STAGING_DIR/storage/uploads/.gitkeep"

echo "==> Create ZIP: ${ZIP_PATH}"
mkdir -p "$(dirname "$ZIP_PATH")"
rm -f "$ZIP_PATH"

if command -v zip >/dev/null 2>&1; then
  (
    cd "$BUILD_DIR/staging"
    zip -rq "$ZIP_PATH" nene-corpus
  )
else
  php -r '
    $zipPath = getenv("ZIP_PATH");
    $stagingDir = getenv("STAGING_PARENT");
    $rootName = "nene-corpus";
    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        fwrite(STDERR, "error: unable to create zip archive\n");
        exit(1);
    }
    $base = $stagingDir . "/" . $rootName;
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($base, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST,
    );
    foreach ($iterator as $file) {
        $path = $file->getPathname();
        $local = $rootName . "/" . substr($path, strlen($base) + 1);
        if ($file->isDir()) {
            $zip->addEmptyDir(rtrim(str_replace("\\", "/", $local), "/"));
            continue;
        }
        $zip->addFile($path, str_replace("\\", "/", $local));
    }
    $zip->close();
  ' ZIP_PATH="$ZIP_PATH" STAGING_PARENT="$BUILD_DIR/staging"
fi

echo "==> Done"
echo "    ${ZIP_PATH}"
echo "    $(du -h "$ZIP_PATH" | cut -f1) — upload nene-corpus/ to hosting, then open /install/"
