#!/bin/sh
set -e

HTML_DIR="${HTML_DIR:-/usr/share/nginx/html}"

: "${APP_NAME:=Evo CRM}"
: "${APP_TITLE:=Evo CRM}"
: "${APP_LOGO_URL:=}"
: "${APP_DOCS_URL:=}"
: "${APP_SUPPORT_URL:=}"
: "${APP_COPYRIGHT:=}"

if [ -z "$APP_LOGO_URL" ] && [ -f "$HTML_DIR/branding/logo.svg" ]; then
  APP_LOGO_URL="/branding/logo.svg"
fi

if [ -z "$APP_LOGO_URL" ]; then
  APP_LOGO_URL="/logo.svg"
fi

: "${APP_FAVICON_URL:=$APP_LOGO_URL}"

escape_sed_replacement() {
  printf '%s' "$1" | sed 's/[&\\]/\\&/g'
}

APP_NAME_ESCAPED=$(escape_sed_replacement "$APP_NAME")
APP_TITLE_ESCAPED=$(escape_sed_replacement "$APP_TITLE")
APP_LOGO_URL_ESCAPED=$(escape_sed_replacement "$APP_LOGO_URL")
APP_FAVICON_URL_ESCAPED=$(escape_sed_replacement "$APP_FAVICON_URL")
APP_DOCS_URL_ESCAPED=$(escape_sed_replacement "$APP_DOCS_URL")
APP_SUPPORT_URL_ESCAPED=$(escape_sed_replacement "$APP_SUPPORT_URL")
APP_COPYRIGHT_ESCAPED=$(escape_sed_replacement "$APP_COPYRIGHT")

find "$HTML_DIR" -type f \( -name '*.html' -o -name '*.js' \) | while IFS= read -r file; do
  sed -i \
    -e "s|__APP_NAME_PLACEHOLDER__|$APP_NAME_ESCAPED|g" \
    -e "s|__APP_TITLE_PLACEHOLDER__|$APP_TITLE_ESCAPED|g" \
    -e "s|__APP_LOGO_URL_PLACEHOLDER__|$APP_LOGO_URL_ESCAPED|g" \
    -e "s|__APP_FAVICON_URL_PLACEHOLDER__|$APP_FAVICON_URL_ESCAPED|g" \
    -e "s|__APP_DOCS_URL_PLACEHOLDER__|$APP_DOCS_URL_ESCAPED|g" \
    -e "s|__APP_SUPPORT_URL_PLACEHOLDER__|$APP_SUPPORT_URL_ESCAPED|g" \
    -e "s|__APP_COPYRIGHT_PLACEHOLDER__|$APP_COPYRIGHT_ESCAPED|g" \
    "$file"
done
