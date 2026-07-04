# HomeSync frontend — Dockerfile (versione allineata)
#
# Strategia: il prototipo è statico (HTML + JSX trasformati da Babel
# nel browser). Niente build step. Aggiungiamo SOLO 3 script bridge
# (api-client / api-bridge / user-picker) prima dei lib originali.
#
# Layout atteso al build context (./frontend):
#   frontend/
#   ├── Dockerfile           (questo)
#   ├── nginx.conf
#   ├── public/runtime-config.json
#   └── app/
#       ├── index.html       (= HomeSync Prototype.html con bridge iniettato)
#       ├── lib/             (= prototipo originale, copiato da setup.sh)
#       └── lib-bridge/      (= api-client.js + api-bridge.js + user-picker.js)

FROM nginx:1.27-alpine

RUN apk add --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf

RUN rm -rf /usr/share/nginx/html/*

# Asset statici
COPY app/index.html      /usr/share/nginx/html/index.html
COPY app/lib/            /usr/share/nginx/html/lib/
COPY app/lib-bridge/     /usr/share/nginx/html/lib-bridge/
COPY app/favicon.png     /usr/share/nginx/html/favicon.png
COPY app/favicon.ico     /usr/share/nginx/html/favicon.ico
COPY app/manifest.json   /usr/share/nginx/html/manifest.json
COPY app/sw.js           /usr/share/nginx/html/sw.js
COPY app/icon.svg        /usr/share/nginx/html/icon.svg
COPY app/icons/          /usr/share/nginx/html/icons/
COPY public/runtime-config.json /usr/share/nginx/html/runtime-config.json

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS http://localhost/health || exit 1
