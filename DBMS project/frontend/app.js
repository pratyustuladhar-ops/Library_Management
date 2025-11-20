// --------- CONFIG ---------
const API_BASE = ""; // same origin as FastAPI service

// --------- THEME LOGIC ---------
const root = document.documentElement;
const accentInput = document.getElementById("accentColor");
const randomThemeBtn = document.getElementById("randomThemeBtn");
const modeToggleBtn = document.getElementById("modeToggleBtn");
const toastEl = document.getElementById("toast");

function setAccentColor(hex) {
  root.style.setProperty("--accent", hex);
  root.style.setProperty("--accent-soft", hex + "25"); // cheap alpha suffix
  accentInput.value = hex;
}

function randomAccent() {
  const h = Math.floor(Math.random() * 360);
  const s = 70;
  const l = 55;
  // Convert HSL -> hex (light implementation)
  const hex = hslToHex(h, s, l);
  setAccentColor(hex);
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

accentInput.addEventListener("input", (e) => {
  setAccentColor(e.target.value);
});

randomThemeBtn.addEventListener("click", () => {
  randomAccent();
  showToast("Theme color updated");
});

modeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  const light = document.body.classList.contains("light-mode");
  modeToggleBtn.textContent = light ? "🌙 Dark Mode" : "☀ Light Mode";
});

// --------- TOAST ---------
let toastTimeout = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  toastEl.classList.add("show");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove("show");
    setTimeout(() => toastEl.classList.add("hidden"), 200);
  }, 2200);
}

// --------- TABS ---------
const tabButtons = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".panel");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    panels.forEach((p) => {
      p.classList.toggle("active", p.id === target);
    });
  });
});

// --------- BOOKS CRUD ---------
const booksTableBody = document.getElementById("booksTableBody");
const booksCount = document.getElementById("booksCount");
const refreshBooksBtn = document.getElementById("refreshBooksBtn");
const bookForm = document.getElementById("bookForm");
const bookFormMsg = document.getElementById("bookFormMsg");
const editBookIdInput = document.getElementById("editBookId");
const cancelEditBookBtn = document.getElementById("cancelEditBook");

async function loadBooks() {
  try {
    const res = await fetch(`${API_BASE}/api/books`);
    const data = await res.json();
    renderBooks(data || []);
  } catch (err) {
    console.error(err);
    showToast("Failed to load books");
  }
}

function renderBooks(books) {
  booksTableBody.innerHTML = "";
  booksCount.textContent = `${books.length} book${books.length === 1 ? "" : "s"}`;

  books.forEach((book) => {
    const tr = document.createElement("tr");

    // ⚠️ Adjust fields based on your BookOut schema
    const id = book.id ?? "";
    const title = book.title ?? "N/A";
    const author = book.author ?? book.writer ?? "N/A";
    const year = book.published_year ?? book.year ?? "";
    const copies = book.copies ?? book.available_copies ?? "";

    tr.innerHTML = `
      <td>${id}</td>
      <td>${escapeHtml(title)}</td>
      <td>${escapeHtml(author)}</td>
      <td>${year}</td>
      <td>${copies}</td>
      <td>
        <button class="table-action edit" data-id="${id}">Edit</button>
        <button class="table-action delete" data-id="${id}">Delete</button>
      </td>
    `;
    booksTableBody.appendChild(tr);
  });

  booksTableBody.querySelectorAll(".table-action.edit").forEach((btn) => {
    btn.addEventListener("click", () => startEditBook(btn.dataset.id, books));
  });

  booksTableBody.querySelectorAll(".table-action.delete").forEach((btn) => {
    btn.addEventListener("click", () => deleteBook(btn.dataset.id));
  });
}

function startEditBook(id, books) {
  const book = books.find((b) => b.id == id);
  if (!book) return;
  editBookIdInput.value = id;

  // Fill the form (adjust keys to match schema)
  bookForm.title.value = book.title ?? "";
  bookForm.author.value = book.author ?? "";
  bookForm.isbn.value = book.isbn ?? "";
  bookForm.published_year.value = book.published_year ?? "";
  bookForm.copies.value = book.copies ?? 1;

  bookFormMsg.textContent = `Editing book #${id}`;
  bookFormMsg.className = "form-msg";
}

async function deleteBook(id) {
  if (!confirm(`Delete book #${id}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/api/books/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to delete");
    }
    showToast("Book deleted");
    await loadBooks();
  } catch (err) {
    console.error(err);
    showToast("Error deleting book");
  }
}

bookForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  bookFormMsg.textContent = "";
  bookFormMsg.className = "form-msg";

  const formData = new FormData(bookForm);
  const payload = Object.fromEntries(formData.entries());

  // convert some to numbers if present
  if (payload.published_year) payload.published_year = Number(payload.published_year);
  if (payload.copies) payload.copies = Number(payload.copies);

  const editId = editBookIdInput.value;
  const url = editId ? `${API_BASE}/api/books/${editId}` : `${API_BASE}/api/books`;
  const method = editId ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error((data && data.detail) || "Failed to save");
    }

    bookFormMsg.textContent = editId ? "Book updated" : "Book created";
    bookFormMsg.classList.add("success");
    showToast(bookFormMsg.textContent);
    bookForm.reset();
    editBookIdInput.value = "";
    await loadBooks();
  } catch (err) {
    console.error(err);
    bookFormMsg.textContent = err.message;
    bookFormMsg.classList.add("error");
  }
});

cancelEditBookBtn.addEventListener("click", () => {
  bookForm.reset();
  editBookIdInput.value = "";
  bookFormMsg.textContent = "";
  bookFormMsg.className = "form-msg";
});

refreshBooksBtn.addEventListener("click", loadBooks);

// --------- MEMBERS ---------
const membersTableBody = document.getElementById("membersTableBody");
const membersCount = document.getElementById("membersCount");
const refreshMembersBtn = document.getElementById("refreshMembersBtn");
const memberForm = document.getElementById("memberForm");
const memberFormMsg = document.getElementById("memberFormMsg");

async function loadMembers() {
  try {
    const res = await fetch(`${API_BASE}/api/members`);
    const data = await res.json();
    renderMembers(data || []);
  } catch (err) {
    console.error(err);
    showToast("Failed to load members");
  }
}

function renderMembers(members) {
  membersTableBody.innerHTML = "";
  membersCount.textContent = `${members.length} member${
    members.length === 1 ? "" : "s"
  }`;

  members.forEach((m) => {
    // ⚠️ Adjust fields to match MemberOut
    const id = m.id ?? "";
    const name = m.full_name ?? m.name ?? "N/A";
    const email = m.email ?? "N/A";
    const joined = m.joined_at || m.created_at || "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${id}</td>
      <td>${escapeHtml(name)}</td>
      <td>${escapeHtml(email)}</td>
      <td>${formatDate(joined)}</td>
    `;
    membersTableBody.appendChild(tr);
  });
}

memberForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  memberFormMsg.textContent = "";
  memberFormMsg.className = "form-msg";

  const formData = new FormData(memberForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const res = await fetch(`${API_BASE}/api/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error((data && data.detail) || "Failed to add member");
    }

    memberFormMsg.textContent = "Member added";
    memberFormMsg.classList.add("success");
    showToast("Member created");
    memberForm.reset();
    await loadMembers();
  } catch (err) {
    console.error(err);
    memberFormMsg.textContent = err.message;
    memberFormMsg.classList.add("error");
  }
});

refreshMembersBtn.addEventListener("click", loadMembers);

// --------- LOANS ---------
const loansTableBody = document.getElementById("loansTableBody");
const loansCount = document.getElementById("loansCount");
const refreshLoansBtn = document.getElementById("refreshLoansBtn");
const loanForm = document.getElementById("loanForm");
const loanFormMsg = document.getElementById("loanFormMsg");

async function loadLoans() {
  try {
    const res = await fetch(`${API_BASE}/api/loans`);
    const data = await res.json();
    renderLoans(data || []);
  } catch (err) {
    console.error(err);
    showToast("Failed to load loans");
  }
}

function renderLoans(loans) {
  loansTableBody.innerHTML = "";
  loansCount.textContent = `${loans.length} loan${loans.length === 1 ? "" : "s"}`;

  loans.forEach((loan) => {
    // ⚠️ Adjust based on LoanOut
    const id = loan.id ?? "";
    const bookLabel =
      loan.book_title ||
      (loan.book && loan.book.title) ||
      `Book #${loan.book_id ?? "?"}`;
    const memberLabel =
      loan.member_name ||
      (loan.member && loan.member.full_name) ||
      `Member #${loan.member_id ?? "?"}`;

    const issued = loan.issue_date || loan.issued_at || loan.created_at || "";
    const due = loan.due_date || "";
    const returned = loan.return_date || loan.returned_at || null;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${id}</td>
      <td>${escapeHtml(bookLabel)}</td>
      <td>${escapeHtml(memberLabel)}</td>
      <td>${formatDateTime(issued)}</td>
      <td>${formatDate(due)}</td>
      <td>${returned ? formatDateTime(returned) : "-"}</td>
      <td>
        ${
          returned
            ? `<span class="badge">Returned</span>`
            : `<button class="table-action return" data-id="${id}">Return</button>`
        }
      </td>
    `;
    loansTableBody.appendChild(tr);
  });

  loansTableBody.querySelectorAll(".table-action.return").forEach((btn) => {
    btn.addEventListener("click", () => returnLoan(btn.dataset.id));
  });
}

async function returnLoan(id) {
  try {
    const res = await fetch(`${API_BASE}/api/loans/${id}/return`, {
      method: "POST",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error((data && data.detail) || "Failed to mark return");
    }
    showToast("Loan marked as returned");
    await loadLoans();
  } catch (err) {
    console.error(err);
    showToast(err.message);
  }
}

loanForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loanFormMsg.textContent = "";
  loanFormMsg.className = "form-msg";

  const formData = new FormData(loanForm);
  const payload = Object.fromEntries(formData.entries());
  payload.book_id = Number(payload.book_id);
  payload.member_id = Number(payload.member_id);

  try {
    const res = await fetch(`${API_BASE}/api/loans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error((data && data.detail) || "Failed to create loan");
    }
    loanFormMsg.textContent = "Loan created";
    loanFormMsg.classList.add("success");
    showToast("Book issued");
    loanForm.reset();
    await loadLoans();
  } catch (err) {
    console.error(err);
    loanFormMsg.textContent = err.message;
    loanFormMsg.classList.add("error");
  }
});

refreshLoansBtn.addEventListener("click", loadLoans);

// --------- HELPERS ---------
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

// --------- INITIALIZE ---------
window.addEventListener("DOMContentLoaded", () => {
  // random accent on first load
  randomAccent();
  // load data
  loadBooks();
  loadMembers();
  loadLoans();
});
