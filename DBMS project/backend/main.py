from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from . import db, crud, schemas

app = FastAPI(title="Library Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Mount frontend at /app instead of /
frontend_path = Path(__file__).resolve().parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/app", StaticFiles(directory=str(frontend_path), html=True), name="frontend")



def get_db():
    db_session = db.SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()


@app.on_event("startup")
def on_startup():
    # create tables if needed
    db.init_db()


# ----------------- BOOKS -----------------

@app.get("/api/books", response_model=list[schemas.BookOut])
def api_list_books(
    skip: int = 0,
    limit: int = 100,
    db_session: Session = Depends(get_db),
):
    return crud.list_books(db_session, skip=skip, limit=limit)


@app.get("/api/books/{book_id}", response_model=schemas.BookOut)
def api_get_book(book_id: int, db_session: Session = Depends(get_db)):
    book = crud.get_book(db_session, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@app.post("/api/books", response_model=schemas.BookOut)
def api_create_book(book: schemas.BookCreate, db_session: Session = Depends(get_db)):
    return crud.create_book(db_session, book)


@app.put("/api/books/{book_id}", response_model=schemas.BookOut)
def api_update_book(
    book_id: int,
    updates: schemas.BookUpdate,
    db_session: Session = Depends(get_db),
):
    updated = crud.update_book(db_session, book_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Book not found")
    return updated


@app.delete("/api/books/{book_id}")
def api_delete_book(book_id: int, db_session: Session = Depends(get_db)):
    ok = crud.delete_book(db_session, book_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Book not found")
    return {"deleted": True}


# ----------------- MEMBERS -----------------

@app.get("/api/members", response_model=list[schemas.MemberOut])
def api_list_members(
    skip: int = 0,
    limit: int = 100,
    db_session: Session = Depends(get_db),
):
    return crud.list_members(db_session, skip=skip, limit=limit)


@app.post("/api/members", response_model=schemas.MemberOut)
def api_create_member(
    member: schemas.MemberCreate,
    db_session: Session = Depends(get_db),
):
    return crud.create_member(db_session, member)


# ----------------- LOANS -----------------

@app.get("/api/loans", response_model=list[schemas.LoanOut])
def api_list_loans(
    skip: int = 0,
    limit: int = 100,
    db_session: Session = Depends(get_db),
):
    return crud.list_loans(db_session, skip=skip, limit=limit)


@app.post("/api/loans", response_model=schemas.LoanOut)
def api_create_loan(
    loan: schemas.LoanCreate,
    db_session: Session = Depends(get_db),
):
    try:
        return crud.create_loan(db_session, loan)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/loans/{loan_id}/return", response_model=schemas.LoanOut)
def api_return_loan(loan_id: int, db_session: Session = Depends(get_db)):
    ln = crud.return_loan(db_session, loan_id)
    if not ln:
        raise HTTPException(status_code=404, detail="Loan not found")
    return ln
