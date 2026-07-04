import json
import logging
import base64
from pywebpush import webpush, WebPushException
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

logger = logging.getLogger("homesync")

def generate_vapid_keys():
    """Generate VAPID public/private key pair (secp256r1/prime256v1)."""
    try:
        private_key = ec.generate_private_key(ec.SECP256R1())
        public_key = private_key.public_key()
        
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        # RAW Uncompressed public key (65 bytes) required for VAPID
        pub_bytes = public_key.public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint
        )
        
        private_key_str = private_pem.decode('utf-8')
        public_key_str = base64.urlsafe_b64encode(pub_bytes).decode('utf-8').rstrip('=')
        
        return public_key_str, private_key_str
    except Exception as e:
        logger.error(f"Failed to generate VAPID keys: {e}")
        return "", ""

def send_web_push(subscription_info: dict, data: dict, private_key: str, claims_email: str):
    """Send a web push notification to a subscription."""
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(data),
            vapid_private_key=private_key,
            vapid_claims={"sub": f"mailto:{claims_email}"},
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
