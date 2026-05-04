import sys
import os

# From frontend/api/index.py, we need to go up two levels to reach the root, then into backend
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
sys.path.append(backend_path)

from app.main import app

# This allows Vercel to pick up the FastAPI app
# The app instance must be named 'app'
