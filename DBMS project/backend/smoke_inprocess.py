from fastapi.testclient import TestClient
import sys
from pathlib import Path
from datetime import datetime, timedelta
import json

# ensure project root is on sys.path so 'backend' package can be imported
proj_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(proj_root))
from backend import main

client = TestClient(main.app)

print('Creating member...')
res = client.post('/api/members', json={'full_name':'Alice Example','email':'alice@example.com'})
print(res.status_code, res.text)

print('Creating book...')
res = client.post('/api/books', json={'title':'The Demo Book','author':'Demo Author','copies':2})
print(res.status_code, res.text)

print('Creating loan...')
due = (datetime.utcnow() + timedelta(days=14)).isoformat()
res = client.post('/api/loans', json={'book_id':1,'member_id':1,'due_at':due})
print(res.status_code, res.text)

print('Books list:')
res = client.get('/api/books')
print(res.status_code, json.dumps(res.json(), indent=2))

print('Members list:')
res = client.get('/api/members')
print(res.status_code, json.dumps(res.json(), indent=2))

print('Loans list:')
res = client.get('/api/loans')
print(res.status_code, json.dumps(res.json(), indent=2))
