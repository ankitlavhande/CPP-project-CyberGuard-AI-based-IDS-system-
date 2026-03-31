from datetime import datetime

logs = []

def add_log(level: str, source: str, message: str):
    logs.append({
        "level": level,
        "source": source,
        "message": message,
        "timestamp": datetime.now().strftime("%I:%M:%S %p")
    })
def get_logs():
    return logs
