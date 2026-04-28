from datetime import datetime, timezone, timedelta

# Vietnam Timezone (GMT+7)
ICT = timezone(timedelta(hours=7))

def now_ict():
    """Returns current datetime in Vietnam time."""
    return datetime.now(ICT)

def today_ict():
    """Returns current date in Vietnam time."""
    return now_ict().date()
