# Design Choices

## No-Build Frontend

HomeSync usa React 18 con JSX compilato in-browser da Babel standalone.

I file `react.min.js`, `react-dom.min.js` e `babel.min.js` sono vendorizzati
in `app/vendor/` invece che caricati da CDN. Scelta voluta:

- **Zero dipendenze npm**: nessun `node_modules`, `package.json`, o build tool
- **Funziona offline**: niente CDN = funziona anche senza internet
- **Deploy semplice**: copia i file statici su nginx, fine

Il contro è che il JSX viene compilato lato client, con un breve flash
al primo caricamento. Per un'app per due utenti è accettabile.

## Database

SQLite con WAL mode. Scelto per:
- Zero configurazione (un file)
- Perfetto per 2 utenti
- Facile backup (copia il .db, stop)

FastAPI + SQLAlchemy 2.0 permettono di passare a PostgreSQL senza
riscrivere le query.

## Auth

PIN numerico opzionale (4-6 cifre) → scrypt → session token in
localStorage. Se non impostato, il login richiede solo la scelta
dell'utente. Niente OAuth, niente password complesse: PIN sufficiente
per uso domestico.

## VAPID / Push

Le chiavi VAPID per le notifiche push vengono generate automaticamente
al primo avvio e salvate nel database. Nessuna configurazione manuale.
