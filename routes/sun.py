from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Query

from utils.math import _day_payload

router = APIRouter(prefix="/sun", tags=["Sun"])


@router.get("/today")
def sun_today():
    today = date.today()
    return _day_payload(today)


@router.get("/yesterday")
def sun_yesterday():
    y = date.today() - timedelta(days=1)
    return _day_payload(y)


@router.get("/day")
def sun_specific(day: date = Query(..., description="Formato YYYY-MM-DD")):
    try:
        return _day_payload(day)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
