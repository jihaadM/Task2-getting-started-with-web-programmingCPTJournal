// app.js — CPT Journal main server
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path    = require('path');
const db      = require('./db');

const app = express();

// ── VIEW ENGINE ───────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── MIDDLEWARE ────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));   // parse HTML form data
app.use(express.json());                            // parse JSON (for AJAX)

app.use(session({
  secret:            process.env.SESSION_SECRET || 'cpt-journal-secret',
  resave:            false,
  saveUninitialized: false,
  cookie:            { httpOnly: true, sameSite: 'strict' }
}));

// Pass admin status to every EJS template automatically
app.use((req, res, next) => {
  res.locals.isAdmin = req.session.isAdmin || false;
  next();
});

// ── PUBLIC ROUTES ─────────────────────────────────────────────

// HOME — list all posts, newest first
app.get('/', (req, res) => {
  const posts = db.prepare(
    'SELECT * FROM posts ORDER BY created_at DESC'
  ).all();
  res.render('index', { posts });
});

// ABOUT page
app.get('/about', (req, res) => {
  res.render('about');
});

// POST DETAIL — show one post and its comments
app.get('/post/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).send('Post not found.');
  const comments = db.prepare(
    'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC'
  ).all(req.params.id);
  res.render('post', { post, comments });
});

// SUBMIT COMMENT — AJAX endpoint (returns JSON, no page reload)
app.post('/post/:id/comment', (req, res) => {
  const { author_name, body } = req.body;

  if (!author_name || !body) {
    return res.status(400).json({ ok: false, error: 'Name and comment are required.' });
  }

  // Strip HTML tags to prevent XSS
  const clean = (str) => str.replace(/<[^>]*>/g, '').trim().slice(0, 1000);

  const info = db.prepare(
    'INSERT INTO comments (post_id, author_name, body) VALUES (?, ?, ?)'
  ).run(req.params.id, clean(author_name), clean(body));

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(info.lastInsertRowid);
  res.json({ ok: true, comment });
});

// ── ADMIN AUTH ────────────────────────────────────────────────

app.get('/admin/login', (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin');
  res.render('admin/login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: 'Incorrect username or password. Please try again.' });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Middleware: protect every /admin route below this line
function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) return res.redirect('/admin/login');
  next();
}

// ── ADMIN ROUTES ──────────────────────────────────────────────

// DASHBOARD — list all posts
app.get('/admin', requireAdmin, (req, res) => {
  const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  res.render('admin/dashboard', { posts });
});

// CREATE POST — show form
app.get('/admin/new', requireAdmin, (req, res) => {
  res.render('admin/form', { post: null, action: '/admin/new' });
});

// CREATE POST — handle form submission
app.post('/admin/new', requireAdmin, (req, res) => {
  const { title, content, author } = req.body;
  if (!title || !content) return res.status(400).send('Title and content are required.');
  db.prepare('INSERT INTO posts (title, content, author) VALUES (?, ?, ?)')
    .run(title.trim(), content.trim(), (author || 'Admin').trim());
  res.redirect('/admin');
});

// EDIT POST — show pre-filled form
app.get('/admin/edit/:id', requireAdmin, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).send('Post not found.');
  res.render('admin/form', { post, action: `/admin/edit/${post.id}` });
});

// EDIT POST — handle form submission
app.post('/admin/edit/:id', requireAdmin, (req, res) => {
  const { title, content, author } = req.body;
  if (!title || !content) return res.status(400).send('Title and content are required.');
  db.prepare('UPDATE posts SET title = ?, content = ?, author = ? WHERE id = ?')
    .run(title.trim(), content.trim(), (author || 'Admin').trim(), req.params.id);
  res.redirect('/admin');
});

// DELETE POST — also deletes comments via CASCADE
app.post('/admin/delete/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.redirect('/admin');
});

// ── START SERVER ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CPT Journal running → http://localhost:${PORT}`);
});