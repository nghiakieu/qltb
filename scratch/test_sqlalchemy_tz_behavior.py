
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine, Column, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

ICT = timezone(timedelta(hours=7))

def now_ict():
    return datetime.now(ICT)

Base = declarative_base()

class TestTime(Base):
    __tablename__ = "test_time"
    id = Column(String, primary_key=True)
    t = Column(DateTime, default=now_ict)
    t_tz = Column(DateTime(timezone=True), default=now_ict)

engine = create_engine("sqlite:///test_tz.db")
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# Insert
new_item = TestTime(id="1")
session.add(new_item)
session.commit()

# Query
item = session.query(TestTime).first()
print(f"Original now_ict: {now_ict()}")
print(f"Stored t (naive?): {item.t} | type: {type(item.t)}")
print(f"Stored t_tz (aware?): {item.t_tz} | type: {type(item.t_tz)}")

# Check ISO format
from pydantic import BaseModel
class TestSchema(BaseModel):
    t: datetime
    t_tz: datetime

schema = TestSchema(t=item.t, t_tz=item.t_tz)
print(f"JSON t: {schema.model_dump_json()}")
