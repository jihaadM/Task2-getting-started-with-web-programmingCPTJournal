// ============================================================
// CPT Journal — app.js
// Task 2: Blog/Content Platform | DLBITPEWP01_E
//
// ADMIN SECURITY MODEL (documented per tutor feedback):
// 1. Credentials (ADMIN_USER, ADMIN_PASS) are stored in .env,
//    never hardcoded in this file.
// 2. On successful login, req.session.isAdmin = true is set.
//    Express-session signs a cookie and stores this flag
//    server-side, so the browser never sees the raw value.
// 3. EVERY /admin/* route below is wrapped with the
//    requireAdmin() middleware, which checks
//    req.session.isAdmin before allowing the request through.
//    If the check fails, the visitor is redirected to login.
// 4. /admin/logout destroys the entire session, immediately
//    revoking access — the visitor must log in again to
//    reach any protected route.
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
app.post('/post/:id/comment', (req, res) => {
  const { author_name, body } = req.body;
  if (!author_name || !body) {
    return res.status(400).json({ ok: false, error: 'Name and comment are required.' });
  }
  const clean = (str) => str.replace(/<[^>]*>/g, '').trim().slice(0, 1000);

  const info = db.prepare(
    'INSERT INTO comments (post_id, author_name, body) VALUES (?, ?, ?)'
  ).run(req.params.id, clean(author_name), clean(body));

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