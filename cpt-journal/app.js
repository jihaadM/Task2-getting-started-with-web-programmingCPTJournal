// ============================================================
// CPT Journal — app.js
//
// SECURITY IMPLEMENTATION SUMMARY (consolidated reference)
// All four mechanisms below work together to protect the
// application. Each is implemented in this file unless noted.
// ------------------------------------------------------------
//
// 1. SQL INJECTION DEFENSE — Parameterized Queries
//    WHERE: Every db.prepare(...) call in this file
//    (see /post/:id/comment, /admin/new, /admin/edit/:id,
//    /admin/delete/:id, /admin/comment/delete/:id, and db.js)
//    HOW: All SQL statements use "?" placeholders. User input
//    (req.params.id, req.body fields) is passed as separate
//    bound arguments to .run() / .get() / .all() — NEVER
//    concatenated into the SQL string itself. better-sqlite3
//    binds these values safely, so input such as
//    '; DROP TABLE comments; --
//    is stored as a literal string, not executed as SQL.
//
// 2. XSS DEFENSE — Layer 1: Input Sanitization
//    WHERE: sanitizeInput() function inside the
//    POST /post/:id/comment route
//    HOW: Strips all HTML tags via regex (/<[^>]*>/g) and
//    caps length to 1000 characters before any comment is
//    written to the database. Removes payloads such as
//    <script>...</script> at the point of entry.
//
// 3. XSS DEFENSE — Layer 2: Output Escaping
//    WHERE: views/post.ejs (NOT in this file — rendering
//    happens in the EJS template)
//    HOW: Comments are rendered using EJS's escaped tag
//    <%= c.body %>, never the unescaped <%- c.body %>.
//    <%= %> automatically converts <, >, &, and quotes into
//    HTML entities before the page reaches the browser, so
//    any markup that survived sanitization still cannot
//    execute. Layers 2 and 3 together form defense-in-depth:
//    an attacker must defeat sanitization AND escaping to
//    succeed.
//
// 4. SESSION SECURITY — Admin Authentication
//    WHERE: app.use(session({...})) configuration block below
//    HOW:
//      - secret: process.env.SESSION_SECRET signs the session
//        cookie so it cannot be forged or tampered with.
//      - httpOnly: true blocks client-side JavaScript from
//        reading the cookie, mitigating session-stealing via XSS.
//      - sameSite: 'strict' blocks the cookie from being sent
//        on requests originating from other websites,
//        mitigating CSRF (cross-site request forgery).
//      - maxAge: 2 hours forces automatic logout after
//        inactivity, limiting the window of exposure if a
//        session is somehow compromised.
//    Credentials themselves (ADMIN_USER, ADMIN_PASS) are read
//    from process.env, never hardcoded — see the .env file
//    (excluded from Git via .gitignore).
//
// 5. ROUTE PROTECTION — requireAdmin() Middleware
//    WHERE: requireAdmin() function defined below, then passed
//    as the second argument to every protected route, e.g.
//    app.get('/admin', requireAdmin, (req, res) => {...})
//    HOW: Express runs requireAdmin() BEFORE the route's own
//    handler. It checks req.session.isAdmin === true; if the
//    check fails, the request is redirected to /admin/login
//    and the protected route's logic never executes. This
//    guards every /admin/* route: dashboard, new post, edit
//    post, delete post, and comment moderation.
//
// 6. LOGOUT — Session Destruction
//    WHERE: GET /admin/logout route below
//    HOW: req.session.destroy() completely erases the session,
//    including the isAdmin flag. Any subsequent request to a
//    protected route will fail the requireAdmin() check and
//    redirect to login — access is revoked immediately, not
//    just on the client side.
// ============================================================

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path    = require('path');
const db      = require('./db');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── SESSION CONFIGURATION ───────────────────────────────────
// SESSION_SECRET signs the session cookie so it cannot be
// forged. httpOnly blocks JavaScript from reading the cookie
// (XSS protection). sameSite:'strict' blocks the cookie being
// sent from other sites (CSRF protection).
app.use(session({
  secret:            process.env.SESSION_SECRET || 'cpt-journal-secret',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    maxAge:   1000 * 60 * 60 * 2   // session expires after 2 hours
  }
}));

// Makes isAdmin available in every EJS template automatically,
// so views (like post.ejs) can show/hide admin-only buttons.
app.use((req, res, next) => {
  res.locals.isAdmin = req.session.isAdmin === true;
  next();
});

// ── ADMIN ROUTE PROTECTION MIDDLEWARE ───────────────────────
// Any route that uses requireAdmin will check this BEFORE
// running its own code. If the session doesn't have
// isAdmin === true, the request is redirected to the login
// page and the route's own logic never executes.
function requireAdmin(req, res, next) {
  if (req.session.isAdmin !== true) {
    return res.redirect('/admin/login');
  }
  next();
}

// ============================================================
// PUBLIC ROUTES (no login required)
// ============================================================

app.get('/', (req, res) => {
  const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  res.render('index', { posts });
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/post/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).send('Post not found.');
  const comments = db.prepare(
    'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC'
  ).all(req.params.id);
  res.render('post', { post, comments });
});

// AJAX — visitor submits a comment (Fetch API, no page reload)
// ============================================================
// AJAX — Visitor submits a comment (Fetch API, no page reload)
//
// SECURITY LAYER 1 — SQL INJECTION DEFENSE:
// The INSERT query below uses a PARAMETERIZED QUERY via
// better-sqlite3's prepared statements. The "?" placeholders
// are bound separately from the SQL string itself, so user
// input is NEVER concatenated directly into the query text.
// This means a malicious comment like:
//   '; DROP TABLE comments; --
// is treated as a literal string value to insert, not as
// executable SQL — it cannot break out of the query.
//
// SECURITY LAYER 2 — XSS DEFENSE (input sanitization):
// Before saving, sanitizeInput() strips any HTML tags from
// the submitted name and comment text using a regex, so  This
// prevents stored XSS where a visitor submits a comment like
//   <script>alert('hacked')</script>
// The tags are removed before the data ever reaches the
// database, so a malicious payload is neutralised at the
// point of entry.
//
// SECURITY LAYER 3 — XSS DEFENSE (output escaping):
// Even if a tag somehow survived sanitisation, views/post.ejs
// renders every comment using EJS's escaped output tag
// <%= c.body %> (NOT <%- c.body %>). The <%= %> tag
// automatically converts <, >, &, and quotes into safe HTML
// entities before sending to the browser, so even raw markup
// stored in the database would display as plain text rather
// than execute as code. This is defense-in-depth: two
// independent layers (sanitize on input, escape on output)
// protect against XSS even if one layer were bypassed.
// ============================================================
app.post('/post/:id/comment', (req, res) => {
  const { author_name, body } = req.body;

  if (!author_name || !body) {
    return res.status(400).json({ ok: false, error: 'Name and comment are required.' });
  }

  // Strip HTML/script tags and enforce a maximum length to
  // prevent oversized or markup-laden submissions.
  function sanitizeInput(str) {
    return str
      .replace(/<[^>]*>/g, '')   // remove any HTML tags, e.g. <script>, <img onerror=...>
      .trim()
      .slice(0, 1000);          // cap length to prevent abuse
  }

  const safeAuthorName = sanitizeInput(author_name);
  const safeBody        = sanitizeInput(body);

  if (!safeAuthorName || !safeBody) {
    return res.status(400).json({ ok: false, error: 'Comment cannot be empty after sanitization.' });
  }

  // PARAMETERIZED QUERY: post_id, safeAuthorName, and safeBody
  // are bound as separate parameters, never inserted directly
  // into the SQL string. This is the standard defense against
  // SQL injection in better-sqlite3 and all modern DB drivers.
  const info = db.prepare(
    'INSERT INTO comments (post_id, author_name, body) VALUES (?, ?, ?)'
  ).run(req.params.id, safeAuthorName, safeBody);

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(info.lastInsertRowid);
  res.json({ ok: true, comment });
});

// ============================================================
// ADMIN AUTHENTICATION (login / logout)
// ============================================================

app.get('/admin/login', (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin');
  res.render('admin/login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.isAdmin = true;   // marks this session as authenticated
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: 'Incorrect username or password.' });
});

// LOGOUT: destroys the session completely. After this, isAdmin
// no longer exists anywhere, so requireAdmin() will reject any
// further attempt to reach a protected route until login again.
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ============================================================
// ADMIN — FULL CRUD FOR POSTS
// (Create, Read, Update, Delete — all protected by requireAdmin)
// ============================================================

// READ — dashboard listing every post
app.get('/admin', requireAdmin, (req, res) => {
  const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  const comments = db.prepare(`
    SELECT comments.*, posts.title AS post_title
    FROM comments
    JOIN posts ON posts.id = comments.post_id
    ORDER BY comments.created_at DESC
  `).all();
  res.render('admin/dashboard', { posts, comments });
});

// CREATE — show empty form
app.get('/admin/new', requireAdmin, (req, res) => {
  res.render('admin/form', { post: null, action: '/admin/new' });
});

// CREATE — handle submission
app.post('/admin/new', requireAdmin, (req, res) => {
  const { title, content, author } = req.body;
  if (!title || !content) return res.status(400).send('Title and content are required.');
  db.prepare('INSERT INTO posts (title, content, author) VALUES (?, ?, ?)')
    .run(title.trim(), content.trim(), (author || 'Admin').trim());
  res.redirect('/admin');
});

// UPDATE — show pre-filled edit form
app.get('/admin/edit/:id', requireAdmin, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).send('Post not found.');
  res.render('admin/form', { post, action: `/admin/edit/${post.id}` });
});

// UPDATE — handle submission
app.post('/admin/edit/:id', requireAdmin, (req, res) => {
  const { title, content, author } = req.body;
  if (!title || !content) return res.status(400).send('Title and content are required.');
  db.prepare('UPDATE posts SET title = ?, content = ?, author = ? WHERE id = ?')
    .run(title.trim(), content.trim(), (author || 'Admin').trim(), req.params.id);
  res.redirect('/admin');
});

// DELETE — removes post; CASCADE in db.js auto-deletes its comments too
app.post('/admin/delete/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.redirect('/admin');
});

// ============================================================
// ADMIN — COMMENT MODERATION (NEW)
// Lets the admin remove any individual comment without
// deleting the whole post it belongs to.
// ============================================================

app.post('/admin/comment/delete/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  // Redirect back to wherever the request came from (dashboard or post page)
  const back = req.body.redirectTo || '/admin';
  res.redirect(back);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CPT Journal running → http://localhost:${PORT}`);
});