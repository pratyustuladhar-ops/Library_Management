from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# IMPORTANT: URL-encode the @ in your password as %40
# If your DB name is "library" and password is "mrig@shi":
DATABASE_URL = "postgresql+psycopg2://postgres:mrig%40shi@localhost:5432/library"
# If you later change your password to something simple (e.g. "admin123"):
# DATABASE_URL = "postgresql+psycopg2://postgres:admin123@localhost:5432/library"

# For PostgreSQL, no need for connect_args like check_same_thread
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    # Import models so SQLAlchemy knows the tables
    from . import models  # make sure backend/models.py exists
    Base.metadata.create_all(bind=engine)
