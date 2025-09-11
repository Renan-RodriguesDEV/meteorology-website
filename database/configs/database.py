import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Connecting to database at {DATABASE_URL}")
engine = create_engine(DATABASE_URL, pool_recycle=3600, echo=True)
Session = sessionmaker(bind=engine)
session = Session()
Base = declarative_base()


def get_session():
    try:
        yield session
    except Exception as e:
        print(f"Database session error: {e}")
        session.rollback()
    finally:
        session.close()
