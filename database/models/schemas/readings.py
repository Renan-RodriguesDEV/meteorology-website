import datetime

from pydantic import BaseModel


class ReadingSchema(BaseModel):
    temperature: float
    humidity: float


class ReadingSchemaResponse(BaseModel):
    temperature: float
    humidity: float
    timestamp: datetime.datetime
