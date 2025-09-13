from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.configs.database import get_session

router = APIRouter(prefix="/after-day", tags=["AfterDay"])


def _day_bounds(target: date):
    start = datetime.combine(target, datetime.min.time())
    end = start + timedelta(days=1)
    return start, end


@router.get("/summary")
def yesterday_summary(session: Session = Depends(get_session)):
    target = date.today() - timedelta(days=1)
    start, end = _day_bounds(target)
    try:
        query = text(
            """
            SELECT 
                COUNT(*) as count,
                AVG(temperature) as temp_avg,
                MIN(temperature) as temp_min,
                MAX(temperature) as temp_max,
                AVG(humidity) as hum_avg,
                MIN(humidity) as hum_min,
                MAX(humidity) as hum_max
            FROM readings
            WHERE timestamp >= :start AND timestamp < :end
            """
        )
        result = session.execute(query, {"start": start, "end": end}).mappings().first()
        if not result or result["count"] == 0:
            return {"error": "No data for yesterday", "date": target.isoformat()}
        return {
            "date": target.isoformat(),
            "temperature": {
                "avg": round(float(result["temp_avg"]), 2),
                "min": round(float(result["temp_min"]), 2),
                "max": round(float(result["temp_max"]), 2),
            },
            "humidity": {
                "avg": round(float(result["hum_avg"]), 2),
                "min": round(float(result["hum_min"]), 2),
                "max": round(float(result["hum_max"]), 2),
            },
            "count": int(result["count"]),
        }
    except Exception as e:
        print(f"Error in yesterday_summary: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/series")
def yesterday_series(session: Session = Depends(get_session)):
    target = date.today() - timedelta(days=1)
    start, end = _day_bounds(target)
    try:
        query = text(
            """
            SELECT timestamp, temperature, humidity
            FROM readings
            WHERE timestamp >= :start AND timestamp < :end
            ORDER BY timestamp ASC
            """
        )
        rows = session.execute(query, {"start": start, "end": end}).mappings().all()
        data = [
            {
                "timestamp": r["timestamp"].isoformat(),
                "temperature": float(r["temperature"]),
                "humidity": float(r["humidity"]),
            }
            for r in rows
        ]
        return {"date": target.isoformat(), "data": data, "count": len(data)}
    except Exception as e:
        print(f"Error in yesterday_series: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
