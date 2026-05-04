import sys
import os

# Add the backend directory to sys.path so Vercel can find the 'app' package
backend_path = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.append(backend_path)

from app.main import app

# This allows Vercel to pick up the FastAPI app
# The app instance must be named 'app'
