from sqlalchemy import text

from database.configs.database import Base, engine
from database.models.entities.readings import Readings  # Importe o modelo  # noqa: F401

with engine.begin() as conn:
    result = conn.execute(text("SELECT 1"))
    print(result.fetchall())
Base.metadata.create_all(bind=engine)
