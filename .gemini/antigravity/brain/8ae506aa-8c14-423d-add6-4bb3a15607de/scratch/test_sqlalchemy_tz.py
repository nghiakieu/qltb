import os
import sys
from datetime import datetime, timezone, timedelta

# Add parent dir to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))

from sqlalchemy import create_engine, Column, String, DateTime
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.datetime_utils import now_ict

class Base(DeclarativeBase):
    pass

class TestModel(Base):
    __tablename__ = "test_table"
    id = Column(String, primary_key=True)
    dt = Column(DateTime, default=now_ict)

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# Create record
t = TestModel(id="1")
session.add(t)
session.commit()

# Retrieve record
retrieved = session.query(TestModel).first()
print(f"Retrieved dt type: {type(retrieved.dt)}")
print(f"Retrieved dt value: {retrieved.dt.isoformat()}")
print(f"Retrieved dt tzinfo: {retrieved.dt.tzinfo}")
