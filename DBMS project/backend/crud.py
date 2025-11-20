from datetime import datetime

from sqlalchemy.orm import Session

from . import models, schemas


# ---------- BOOKS ----------

def get_book(db: Session, book_id: int):
    return db.query(models.Book).filter(models.Book.id == book_id).first()


def list_books(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Book).offset(skip).limit(limit).all()


def create_book(db: Session, book: schemas.BookCreate):
    db_book = models.Book(**book.model_dump())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book


def update_book(db: Session, book_id: int, updates: schemas.BookUpdate):
    db_book = get_book(db, book_id)
    if not db_book:
        return None

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(db_book, field, value)

    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book


def delete_book(db: Session, book_id: int):
    db_book = get_book(db, book_id)
    if not db_book:
        return False
    db.delete(db_book)
    db.commit()
    return True


# ---------- MEMBERS ----------

def list_members(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Member).offset(skip).limit(limit).all()


def create_member(db: Session, member: schemas.MemberCreate):
    db_member = models.Member(**member.model_dump())
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member


# ---------- LOANS ----------

def list_loans(db: Session, skip: int = 0, limit: int = 100):
    """
    This naturally uses joins: Loan -> Book -> Member via relationships.
    """
    return db.query(models.Loan).offset(skip).limit(limit).all()


def create_loan(db: Session, loan: schemas.LoanCreate):
    # 1. ensure book + member exist
    book = db.query(models.Book).filter(models.Book.id == loan.book_id).first()
    member = db.query(models.Member).filter(models.Member.id == loan.member_id).first()

    if not book:
        raise ValueError("Book not found")
    if not member:
        raise ValueError("Member not found")

    # 2. (Optional) seat/copies logic: check at least 1 copy
    if book.copies is not None and book.copies <= 0:
        raise ValueError("No copies available for this book")

    # 3. create loan
    db_loan = models.Loan(
        book_id=loan.book_id,
        member_id=loan.member_id,
        due_at=loan.due_at,
        loaned_at=datetime.utcnow(),
    )

    # Decrement copies if you want to track availability
    if book.copies is not None:
        book.copies -= 1

    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan


def return_loan(db: Session, loan_id: int):
    db_loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
    if not db_loan:
        return None

    if db_loan.returned_at is None:
        db_loan.returned_at = datetime.utcnow()
        # increment copies back
        book = db_loan.book
        if book and book.copies is not None:
            book.copies += 1
        db.add(db_loan)
        db.commit()
        db.refresh(db_loan)

    return db_loan
