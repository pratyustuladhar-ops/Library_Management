# Library Management (FastAPI + Postgres + Frontend)

This project provides a minimal library management system: a FastAPI backend (CRUD for books), a simple HTML/CSS/JS frontend, and a Postgres schema.

Folders
- `backend/` - FastAPI app and DB code
- `frontend/` - static single-page app (index.html)

Quick start (recommended: Docker)

1. Start Postgres using docker-compose (in repository root):

```powershell
docker compose up -d
```

2. Export DATABASE_URL and install Python dependencies in a virtual environment:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
$Env:DATABASE_URL = 'postgresql://library:library@localhost:5432/librarydb'
pip install -r "backend/requirements.txt"
```

3. Run the FastAPI server:

```powershell
uvicorn backend.main:app --reload --port 8000
```

4. Open the frontend by opening `frontend/index.html` in your browser. The frontend uses `/api/*` endpoints on the same host, so for best results run it via a simple file server or serve the folder with any static server. Alternatively, you can use the backend to also serve static files.

Notes
- If `DATABASE_URL` is not set, the backend will fall back to a local SQLite file `test.db` for quick testing.
- Use `backend/init_db.sql` to initialize Postgres manually if you prefer not to use SQLAlchemy's create_all.
