from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from .db import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True, nullable=False)

    books = relationship("Book", back_populates="category")


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(256), nullable=False)
    email = Column(String(256), nullable=True, unique=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    loans = relationship("Loan", back_populates="member")


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    author = Column(String(256), nullable=False)

    # ✅ match schemas.BookBase
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    published_year = Column(Integer, nullable=True)
    isbn = Column(String(32), nullable=True, unique=True)
    copies = Column(Integer, nullable=False, default=1)  # how many copies total
    available = Column(Boolean, default=True)

    category = relationship("Category", back_populates="books")
    loans = relationship("Loan", back_populates="book")


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)

    loaned_at = Column(DateTime, default=datetime.utcnow)
    due_at = Column(DateTime, nullable=False)
    returned_at = Column(DateTime, nullable=True)

    book = relationship("Book", back_populates="loans")
    member = relationship("Member", back_populates="loans")
