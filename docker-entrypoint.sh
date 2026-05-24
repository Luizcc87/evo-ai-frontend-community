#!/bin/sh
set -e

# =============================================================================
# Runtime environment variable injection for Vite-built apps
# =============================================================================
# Replaces placeholder values in the built JS files with actual environment
# variables at container startup, enabling runtime configuration without
# rebuilding the image.
# =============================================================================

HTML_DIR="/usr/share/nginx/html"

# Fill runtime defaults so placeholders are never left in the built app just
# because one optional VITE_* variable was omitted from the container env.
: "${VITE_API_URL:=http://localhost:3000}"
: "${VITE_AUTH_API_URL:=$VITE_API_URL}"
: "${VITE_EVOAI_API_URL:=$VITE_API_URL}"
: "${VITE_AGENT_PROCESSOR_URL:=$VITE_API_URL}"

if [ -z "$VITE_WS_URL" ]; then
  case "$VITE_API_URL" in
    https://*) VITE_WS_URL="wss://${VITE_API_URL#https://}" ;;
    http://*) VITE_WS_URL="ws://${VITE_API_URL#http://}" ;;
    *) VITE_WS_URL="$VITE_API_URL" ;;
  esac
fi

echo "Runtime config: VITE_API_URL=$VITE_API_URL"
echo "Runtime config: VITE_AUTH_API_URL=$VITE_AUTH_API_URL"
echo "Runtime config: VITE_WS_URL=$VITE_WS_URL"
echo "Runtime config: VITE_EVOAI_API_URL=$VITE_EVOAI_API_URL"
echo "Runtime config: VITE_AGENT_PROCESSOR_URL=$VITE_AGENT_PROCESSOR_URL"

# Replace VITE_* variables in built assets (js, css, html).
for file in $(find "$HTML_DIR" \( -name '*.js' -o -name '*.css' -o -name '*.html' \) -type f); do
  sed -i "s|VITE_API_URL_PLACEHOLDER|${VITE_API_URL}|g" "$file"
  sed -i "s|VITE_AUTH_API_URL_PLACEHOLDER|${VITE_AUTH_API_URL}|g" "$file"
  sed -i "s|VITE_WS_URL_PLACEHOLDER|${VITE_WS_URL}|g" "$file"
  sed -i "s|VITE_EVOAI_API_URL_PLACEHOLDER|${VITE_EVOAI_API_URL}|g" "$file"
  sed -i "s|VITE_AGENT_PROCESSOR_URL_PLACEHOLDER|${VITE_AGENT_PROCESSOR_URL}|g" "$file"
  [ -n "$VITE_EVOFLOW_API_URL" ] && sed -i "s|VITE_EVOFLOW_API_URL_PLACEHOLDER|${VITE_EVOFLOW_API_URL}|g" "$file"
done

if grep -R "VITE_.*_PLACEHOLDER" "$HTML_DIR" >/dev/null 2>&1; then
  echo "WARNING: unresolved VITE placeholders remain in built assets:"
  grep -R "VITE_.*_PLACEHOLDER" "$HTML_DIR" || true
fi

# Configure nginx CSP based on environment (default: development)
# The CSP shipped in nginx.conf is the production default: img-src/media-src
# allow 'https:' (external buckets) but no plain-http origin. Chat media served
# by the backend (ActiveStorage local disk) comes from the API origin, which is
# plain http in development and in self-hosted deploys without TLS — without
# the adjustments below the browser blocks images/audio in the chat (EVO-1961).
# All substitutions are anchored on the trailing ';' or guarded so a container
# restart does not append the same source twice.
APP_ENV="${VITE_APP_ENV:-development}"
NGINX_CONF="/etc/nginx/conf.d/default.conf"

if [ "$APP_ENV" = "development" ]; then
  # Development: allow localhost (any port) for API calls and for media served
  # by the backend, and permissive frame-ancestors for the widget.
  sed -i \
    -e "s|connect-src 'self' blob: https: wss: ws:;|connect-src 'self' blob: https: wss: ws: http://localhost:*;|" \
    -e "s|img-src 'self' data: blob: https:;|img-src 'self' data: blob: https: http://localhost:*;|" \
    -e "s|media-src 'self' blob: https:;|media-src 'self' blob: https: http://localhost:*;|" \
    -e "s|frame-ancestors 'self';|frame-ancestors *;|" \
    "$NGINX_CONF"
fi

# Self-hosted over plain http (no TLS): media and API calls come from the API
# origin and 'https:' does not cover http origins, so allow it explicitly.
case "$VITE_API_URL" in
  http://*)
    API_ORIGIN="$(printf '%s' "$VITE_API_URL" | sed "s|^\(http://[^/]*\).*|\1|")"
    if ! grep -q "img-src[^;]* $API_ORIGIN" "$NGINX_CONF"; then
      sed -i \
        -e "s|\(img-src [^;]*\);|\1 ${API_ORIGIN};|" \
        -e "s|\(media-src [^;]*\);|\1 ${API_ORIGIN};|" \
        -e "s|\(connect-src [^;]*\);|\1 ${API_ORIGIN};|" \
        "$NGINX_CONF"
    fi
    ;;
esac

[ -f /docker-entrypoint.d/branding-entrypoint.sh ] && sh /docker-entrypoint.d/branding-entrypoint.sh

exec "$@"
