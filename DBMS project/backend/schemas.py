from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ---------- CATEGORY ----------

class CategoryBase(BaseModel):
    name: str


class CategoryOut(CategoryBase):
    id: int

    class Config:
        from_attributes = True  # was orm_mode


# ---------- MEMBER ----------

class MemberBase(BaseModel):
    full_name: str
    email: Optional[str] = None


class MemberCreate(MemberBase):
    pass


class MemberOut(MemberBase):
    id: int
    joined_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------- BOOK ----------

class BookBase(BaseModel):
    title: str
    author: str
    category_id: Optional[int] = None
    published_year: Optional[int] = None
    isbn: Optional[str] = None
    copies: Optional[int] = 1


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category_id: Optional[int] = None
    published_year: Optional[int] = None
    isbn: Optional[str] = None
    copies: Optional[int] = None


class BookOut(BookBase):
    id: int

    class Config:
        from_attributes = True


# ---------- LOAN ----------

class LoanBase(BaseModel):
    book_id: int
    member_id: int
    due_at: datetime


class LoanCreate(LoanBase):
    pass


class LoanOut(LoanBase):
    id: int
    loaned_at: Optional[datetime] = None
    returned_at: Optional[datetime] = None

    class Config:
        from_attributes = True
