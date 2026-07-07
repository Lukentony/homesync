import json
import logging
import base64
from pywebpush import webpush, WebPushException
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

logger = logging.getLogger("homesync")

def generate_vapid_keys():
    """Generate VAPID public/private key pair (secp256r1/prime256v1).

    La chiave privata va salvata in formato RAW (32 byte, base64url, senza
    padding), NON in PEM: py_vapid.Vapid.from_string() (usato internamente
    da pywebpush) non riconosce l'armatura PEM — si limita a togliere gli
    a-capo e decodificare tutta la stringa come base64url, header inclusi,
    corrompendo silenziosamente la chiave (bug scoperto il 2026-07-06: ogni
    invio push falliva senza errori visibili, mascherato da un except troppo
    permissivo in send_web_push)."""
    try:
        private_key = ec.generate_private_key(ec.SECP256R1())
        public_key = private_key.public_key()

        private_value = private_key.private_numbers().private_value
        raw_private = private_value.to_bytes(32, byteorder='big')

        # RAW Uncompressed public key (65 bytes) required for VAPID
        pub_bytes = public_key.public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint
        )

        private_key_str = base64.urlsafe_b64encode(raw_private).decode('utf-8').rstrip('=')
        public_key_str = base64.urlsafe_b64encode(pub_bytes).decode('utf-8').rstrip('=')

        return public_key_str, private_key_str
    except Exception as e:
        logger.error(f"Failed to generate VAPID keys: {e}")
        return "", ""

def send_web_push(subscription_info: dict, data: dict, private_key: str, claims_email: str):
    """Send a web push notification to a subscription.

    Il valore di ritorno indica SOLO se la subscription va tenuta (True) o
    cancellata (False, solo su 404/410 — endpoint scaduto/disiscritto) — non
    indica che l'invio sia andato a buon fine. Un errore generico (bug di
    libreria, chiave malformata, ecc.) ritorna True apposta per non cancellare
    una subscription valida per un problema transitorio o di codice, ma va
    SEMPRE loggato: verificare che il logger "homesync" sia configurato
    (vedi logging.basicConfig in main.py) altrimenti questi errori restano
    invisibili — causa reale di un bug del 2026-07-06 in cui il push non
    veniva mai consegnato senza che nessun log lo segnalasse."""
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(data),
            vapid_private_key=private_key,
            vapid_claims={"sub": f"mailto:{claims_email}"},
            # pywebpush di default manda ttl=0 ("consegna subito o scarta"):
            # se il dispositivo non e' raggiungibile in quel preciso istante
            # (schermo spento, doze mode, connessione al push service non
            # attiva) il messaggio viene perso silenziosamente, non messo in
            # coda. Causa reale del bug "arriva solo se apro l'app" scoperto
            # il 2026-07-06. 24h e' un compromesso ragionevole per promemoria
            # non urgenti.
            ttl=86400,
        )
        return True
    except WebPushException as ex:
        # 404/410 means the subscription is expired or unregistered
        if ex.response is not None and ex.response.status_code in [404, 410]:
            logger.warning(f"Subscription expired: status {ex.response.status_code}")
            return False
        logger.error(f"Web Push WebPushException: {ex}")
        return True
    except Exception as e:
        logger.error(f"Unexpected Web Push error: {e}")
        return True
