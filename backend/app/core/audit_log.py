import logging
import sys

# Configure audit logger to use stdout (compatible with Vercel Serverless)
# Vercel has a read-only filesystem, so we cannot write to log files.
# Logs will appear in the Vercel Logs dashboard instead.
audit_logger = logging.getLogger("audit_logger")
audit_logger.setLevel(logging.INFO)

# Use StreamHandler (stdout) instead of FileHandler
if not audit_logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - [%(levelname)s] - %(message)s'
    )
    handler.setFormatter(formatter)
    audit_logger.addHandler(handler)


def log_audit_event(user: str, action: str, details: str):
    """
    Logs an administrative or sensitive action.
    Output goes to stdout and is visible in Vercel Logs dashboard.
    """
    audit_logger.info(f"User: {user} | Action: {action} | Details: {details}")
