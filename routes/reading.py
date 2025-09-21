import datetime
from http import HTTPStatus

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.configs.database import get_session
from database.models.entities.readings import Readings
from database.models.schemas.readings import (
    ReadingSchema,
    ReadingSchemaResponse,
)
from utils.dataframe import get_csv_bytes

router = APIRouter(prefix="/readings", tags=["Readings"])


@router.get("/latest")
def get_latest(session: Session = Depends(get_session)):
    try:
        query = text("""
                    SELECT temperature, humidity, timestamp 
                    FROM readings 
                    ORDER BY timestamp DESC 
                    LIMIT 1
                     """)
        latest_reading = session.execute(query)
        result = latest_reading.mappings().first()

        if result:
            return result
        else:
            return {"temperature": None, "humidity": None, "timestamp": None}
    except Exception as e:
        print(f"Error in get_latest: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/24h")
def last_24h(session: Session = Depends(get_session)):
    try:
        query = text("""
                     SELECT temperature, humidity, timestamp 
                     FROM readings WHERE timestamp >= NOW() - INTERVAL 1 DAY ORDER BY timestamp ASC
                     """)
        lasts_24h_readings = session.execute(query)
        results = lasts_24h_readings.mappings().all()

        return results
    except Exception as e:
        print(f"Error in last_24h: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/15d")
def last_15d(session: Session = Depends(get_session)):
    try:
        query = text("""
                     SELECT temperature, humidity, timestamp 
                     FROM readings WHERE timestamp >= NOW() - INTERVAL 15 DAY ORDER BY timestamp ASC
                     """)
        lasts_15d_readings = session.execute(query)
        results = lasts_15d_readings.mappings().all()

        return results
    except Exception as e:
        print(f"Error in last_15d: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/30d")
def last_30d(session: Session = Depends(get_session)):
    try:
        query = text("""
                     SELECT temperature, humidity, timestamp 
                     FROM readings WHERE timestamp >= NOW() - INTERVAL 30 DAY ORDER BY timestamp ASC
                     """)
        lasts_30d_readings = session.execute(query)
        results = lasts_30d_readings.mappings().all()

        return results
    except Exception as e:
        print(f"Error in last_30d: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/", status_code=HTTPStatus.CREATED, response_model=ReadingSchemaResponse)
def add(reading: ReadingSchema, session: Session = Depends(get_session)):
    try:
        new_reading = Readings(**reading.model_dump())
        session.add(new_reading)
        session.commit()
        session.refresh(new_reading)
        return new_reading
    except Exception as e:
        print(f"Error in add: {e}")
        session.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/file")
def get_file(
    timestamp: datetime.datetime | None = None,
    session: Session = Depends(get_session),
):
    """Get readings from a specific timestamp.

    Args:
        timestamp (datetime.datetime): The timestamp to filter readings from. Defaults to current time.
    """
    try:
        # Define o timestamp padrão no momento da requisição
        if timestamp is None:
            timestamp = datetime.datetime.now() - datetime.timedelta(days=365)

        # Normaliza datetimes com timezone para naive (compatível com MySQL DATETIME)
        if getattr(timestamp, "tzinfo", None) is not None:
            timestamp = timestamp.replace(tzinfo=None)

        query = text("""
        SELECT timestamp,temperature,humidity FROM readings
        WHERE timestamp >= :timestamp
        ORDER BY timestamp ASC
        """)
        result = session.execute(query, {"timestamp": timestamp})
        if not result:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, "Is not possible take registers"
            )
        rows = result.mappings().all()
        return get_csv_bytes(rows, filename="readings.csv")
    except Exception as e:
        raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, str(e))
