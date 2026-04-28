"""Base model with common fields for all entities."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import DeclarativeBase


from app.core.datetime_utils import now_ict


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    """Mixin that adds created_at and updated_at timestamps."""
    created_at = Column(
        DateTime,
        default=now_ict,
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        default=now_ict,
        onupdate=now_ict,
        nullable=False,
    )


def generate_uuid():
    """Generate a UUID string for primary keys."""
    return str(uuid.uuid4())
