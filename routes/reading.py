from http import HTTPStatus

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.configs.database import get_session
from database.models.entities.readings import Readings
from database.models.schemas.readings import ReadingSchema, ReadingSchemaResponse

router = APIRouter(prefix="/readings", tags=["Readings"])


@router.get("/24h")
def last_24h(session: Session = Depends(get_session)):
    query = text("""
                 SELECT temperature, humidity, timestamp 
                 FROM readings WHERE timestamp >= NOW() - INTERVAL 1 DAY ORDER BY timestamp ASC
                 """)
    lasts_24h_readings = session.execute(query)

    return lasts_24h_readings.mappings().all()


@router.get("/15d")
def last_15d(session: Session = Depends(get_session)):
    query = text("""
                 SELECT temperature, humidity, timestamp 
                 FROM readings WHERE timestamp >= NOW() - INTERVAL 15 DAY ORDER BY timestamp ASC
                 """)
    lasts_15d_readings = session.execute(query)

    return lasts_15d_readings.mappings().all()


@router.get("/30d")
def last_30d(session: Session = Depends(get_session)):
    query = text("""
                 SELECT temperature, humidity, timestamp 
                 FROM readings WHERE timestamp >= NOW() - INTERVAL 30 DAY ORDER BY timestamp ASC
                 """)
    lasts_30d_readings = session.execute(query)

    return lasts_30d_readings.mappings().all()


@router.post("/", status_code=HTTPStatus.CREATED, response_model=ReadingSchemaResponse)
def add(reading: ReadingSchema, session: Session = Depends(get_session)):
    new_reading = Readings(**reading.model_dump())
    session.add(new_reading)
    session.commit()
    session.refresh(new_reading)
    return new_reading
