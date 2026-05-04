import logging
import os
from datetime import datetime

# Ensure logs directory exists
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

# Configure audit logger
audit_logger = logging.getLogger("audit_logger")
audit_logger.setLevel(logging.INFO)

# Create file handler which logs even debug messages
log_file = os.path.join(LOG_DIR, "audit.log")
fh = logging.FileHandler(log_file, encoding='utf-8')
fh.setLevel(logging.INFO)

# Create formatter and add it to the handlers
formatter = logging.Formatter('%(asctime)s - %(name)s - [%(levelname)s] - %(message)s')
fh.setFormatter(formatter)

# Add the handlers to the logger
if not audit_logger.handlers:
    audit_logger.addHandler(fh)

def log_audit_event(user: str, action: str, details: str):
    """
    Logs an administrative or sensitive action.
    """
    audit_logger.info(f"User: {user} | Action: {action} | Details: {details}")
