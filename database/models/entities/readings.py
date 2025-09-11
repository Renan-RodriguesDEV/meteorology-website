from sqlalchemy import Column, DateTime, Double, Integer, func

from database.configs.database import Base


class Readings(Base):
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    timestamp = Column(DateTime, default=func.now(), nullable=False)
    temperature = Column(Double, nullable=False)
    humidity = Column(Double, nullable=False)

    def __init__(self, temperature: float, humidity: float, timestamp: DateTime = None):
        self.temperature = temperature
        self.humidity = humidity
        if timestamp:
            self.timestamp = timestamp
