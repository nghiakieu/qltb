from datetime import datetime, timezone, timedelta
import json

ICT = timezone(timedelta(hours=7))
now = datetime.now(ICT)
print(f"Timezone-aware: {now.isoformat()}")

naive = datetime.now()
print(f"Naive local: {naive.isoformat()}")
