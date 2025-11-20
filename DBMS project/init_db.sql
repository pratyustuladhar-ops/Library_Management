-- Expanded SQL schema for library management
-- Tables: categories, members, books, loans

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(256) NOT NULL,
    email VARCHAR(256) UNIQUE,
    joined_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(256) NOT NULL,
    author VARCHAR(256) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    published_year INTEGER,
    isbn VARCHAR(32) UNIQUE,
    copies INTEGER NOT NULL DEFAULT 1 CHECK (copies >= 0)
);

CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    loaned_at TIMESTAMP NOT NULL DEFAULT now(),
    due_at TIMESTAMP NOT NULL,
    returned_at TIMESTAMP NULL,
    CONSTRAINT one_active_loan_per_book_member UNIQUE (book_id, member_id, returned_at)
);

-- Function: create_loan(book_id, member_id, due_days)
-- Checks availability (copies > 0) and inserts a loan while decrementing copies
CREATE OR REPLACE FUNCTION create_loan_fn(b_id INTEGER, m_id INTEGER, due_days INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_id INTEGER;
BEGIN
    -- check copies
    PERFORM 1 FROM books WHERE id = b_id AND copies > 0;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Book % is not available (no copies)', b_id;
    END IF;

    -- decrement copies
    UPDATE books SET copies = copies - 1 WHERE id = b_id;

    -- insert loan
    INSERT INTO loans (book_id, member_id, due_at)
    VALUES (b_id, m_id, now() + (due_days || ' days')::interval)
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function: return_loan_fn(loan_id)
-- Sets returned_at and increments book copies
CREATE OR REPLACE FUNCTION return_loan_fn(l_id INTEGER)
RETURNS VOID AS $$
DECLARE
    b_id INTEGER;
BEGIN
    SELECT book_id INTO b_id FROM loans WHERE id = l_id AND returned_at IS NULL;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan % not found or already returned', l_id;
    END IF;

    UPDATE loans SET returned_at = now() WHERE id = l_id;
    UPDATE books SET copies = copies + 1 WHERE id = b_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce that due_at is after loaned_at
CREATE OR REPLACE FUNCTION loans_check_due()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.due_at <= NEW.loaned_at THEN
        RAISE EXCEPTION 'due_at must be after loaned_at';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_loans_before_insert ON loans;
CREATE TRIGGER trg_loans_before_insert BEFORE INSERT ON loans
FOR EACH ROW EXECUTE FUNCTION loans_check_due();
