from datetime import datetime, timezone, timedelta
import json
from pydantic import RootModel

ICT = timezone(timedelta(hours=7))

def now_ict():
    return datetime.now(ICT)

t = now_ict()
print(f"Python: {t}")
print(f"ISO: {t.isoformat()}")

class TestModel(RootModel):
    root: datetime

m = TestModel(root=t)
print(f"Pydantic JSON: {m.model_dump_json()}")
