from datetime import datetime, timezone, timedelta

# Vietnam Timezone (GMT+7)
ICT = timezone(timedelta(hours=7))

def now_ict():
    """Returns current datetime in Vietnam time (timezone-aware)."""
    return datetime.now(ICT)

def now_ict_naive():
    """Returns current datetime in Vietnam time (timezone-naive) for DB storage."""
    return datetime.now(ICT).replace(tzinfo=None)

def today_ict():
    """Returns current date in Vietnam time."""
    return now_ict().date()
