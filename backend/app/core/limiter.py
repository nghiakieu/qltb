from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

# Create a Limiter instance that uses the client's IP address
limiter = Limiter(key_func=get_remote_address)
