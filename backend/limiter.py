from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared rate limiter — imported by main.py (app.state.limiter) and individual routers
limiter = Limiter(key_func=get_remote_address)
