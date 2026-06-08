import os

os.makedirs('views/admin', exist_ok=True)
os.makedirs('public', exist_ok=True)

# ── index.ejs ──────────────────────────────────
with open('views/index.ejs', 'w') as f:
    f.write("""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CPT Journal</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="/style.css" rel="stylesheet">
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
  <div class="container">
    <a class="navbar-brand fw-bold" href="/">CPT Journal</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="nav">
      <ul class="navbar-nav ms-auto">
        <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
        <li class="nav-item"><a class="nav-link" href="/about">About</a></li>
        <li class="nav-item"><a class="nav-link" href="/admin/login">Admin</a></li>
      </ul>
    </div>
  </div>
</nav>
<div class="hero py-5 text-white text-center">
  <h1 class="display-4 fw-bold">CPT Journal</h1>
  <p class="lead">Exploring Cape Town - one story at a time</p>
</div>
<div class="container my-5">
  <h2 class="mb-4">Latest Posts</h2>
  <% if (posts.length === 0) { %>
    <p class="text-muted">No posts yet.</p>
  <% } else { %>
    <div class="row g-4">
      <% posts.forEach(function(post) { %>
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 shadow-sm post-card">
            <div class="card-body">
              <h5 class="card-title fw-bold"><%= post.title %></h5>
              <p class="text-muted small">By <%= post.author %> | <%= new Date(post.created_at).toLocaleDateString() %></p>
              <p class="card-text"><%= post.content.slice(0, 120) %>...</p>
            </div>
            <div class="card-footer bg-transparent">
              <a href="/post/<%= post.id %>" class="btn btn-sm btn-dark">Read more</a>
            </div>
          </div>
        </div>
      <% }); %>
    </div>
  <% } %>
</div>
<footer class="bg-dark text-white text-center py-3 mt-5">
  <p class="mb-0 small">2026 CPT Journal | Jihaad Marcus | DLBITPEWP01_E</p>
</footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>""")

# ── post.ejs ───────────────────────────────────
with open('views/post.ejs', 'w') as f:
    f.write("""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= post.title %> | CPT Journal</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="/style.css" rel="stylesheet">
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
  <div class="container">
    <a class="navbar-brand fw-bold" href="/">CPT Journal</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="nav">
      <ul class="navbar-nav ms-auto">
        <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
        <li class="nav-item"><a class="nav-link" href="/about">About</a></li>
        <li class="nav-item"><a class="nav-link" href="/admin/login">Admin</a></li>
      </ul>
    </div>
  </div>
</nav>
<div class="container my-5" style="max-width:800px">
  <a href="/" class="btn btn-sm btn-outline-secondary mb-4">Back to posts</a>
  <article class="mb-5">
    <h1 class="fw-bold"><%= post.title %></h1>
    <p class="text-muted">
      By <strong><%= post.author %></strong> |
      <%= new Date(post.created_at).toLocaleDateString() %>
    </p>
    <hr>
    <div class="post-content">
      <%- post.content.replace(/\\n/g, '<br>') %>
    </div>
  </article>
  <section>
    <h4 class="mb-3">Comments (<span id="count"><%= comments.length %></span>)</h4>
    <div id="list">
      <% if (comments.length === 0) { %>
        <p id="none" class="text-muted">No comments yet. Be the first!</p>
      <% } %>
      <% comments.forEach(function(c) { %>
        <div class="border rounded p-3 mb-3 bg-light">
          <strong><%= c.author_name %></strong>
          <span class="text-muted small ms-2">
            <%= new Date(c.created_at).toLocaleDateString() %>
          </span>
          <p class="mb-0 mt-1"><%= c.body %></p>
        </div>
      <% }); %>
    </div>
    <div class="card mt-4 shadow-sm">
      <div class="card-body">
        <h5 class="card-title">Leave a Comment</h5>
        <div id="msg" class="alert d-none"></div>
        <div class="mb-3">
          <label class="form-label">Name</label>
          <input id="cname" type="text" class="form-control" placeholder="Your name">
        </div>
        <div class="mb-3">
          <label class="form-label">Comment</label>
          <textarea id="cbody" class="form-control" rows="4" placeholder="Write your comment..."></textarea>
        </div>
        <button id="sub" class="btn btn-dark">Submit Comment</button>
      </div>
    </div>
  </section>
</div>
<footer class="bg-dark text-white text-center py-3 mt-5">
  <p class="mb-0 small">2026 CPT Journal | Jihaad Marcus | DLBITPEWP01_E</p>
</footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
  var postId = '<%= post.id %>';
  document.getElementById('sub').addEventListener('click', async function() {
    var name = document.getElementById('cname').value.trim();
    var body = document.getElementById('cbody').value.trim();
    var msg  = document.getElementById('msg');
    if (!name || !body) {
      msg.className = 'alert alert-warning';
      msg.textContent = 'Please fill in both fields.';
      msg.classList.remove('d-none');
      return;
    }
    var btn = document.getElementById('sub');
    btn.disabled = true;
    btn.textContent = 'Posting...';
    try {
      var res  = await fetch('/post/' + postId + '/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_name: name, body: body })
      });
      var data = await res.json();
      if (data.ok) {
        var none = document.getElementById('none');
        if (none) none.remove();
        var div = document.createElement('div');
        div.className = 'border rounded p-3 mb-3 bg-light';
        div.innerHTML = '<strong>' + data.comment.author_name + '</strong>' +
          '<span class="text-muted small ms-2">Just now</span>' +
          '<p class="mb-0 mt-1">' + data.comment.body + '</p>';
        document.getElementById('list').appendChild(div);
        var counter = document.getElementById('count');
        counter.textContent = parseInt(counter.textContent) + 1;
        document.getElementById('cname').value = '';
        document.getElementById('cbody').value = '';
        msg.className = 'alert alert-success';
        msg.textContent = 'Comment posted!';
        msg.classList.remove('d-none');
        setTimeout(function() { msg.classList.add('d-none'); }, 3000);
      }
    } catch(e) {
      msg.className = 'alert alert-danger';
      msg.textContent = 'Error. Please try again.';
      msg.classList.remove('d-none');
    }
    btn.disabled = false;
    btn.textContent = 'Submit Comment';
  });
</script>
</body>
</html>""")

# ── about.ejs ──────────────────────────────────
with open('views/about.ejs', 'w') as f:
    f.write("""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About | CPT Journal</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="/style.css" rel="stylesheet">
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
  <div class="container">
    <a class="navbar-brand fw-bold" href="/">CPT Journal</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="nav">
      <ul class="navbar-nav ms-auto">
        <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
        <li class="nav-item"><a class="nav-link active" href="/about">About</a></li>
        <li class="nav-item"><a class="nav-link" href="/admin/login">Admin</a></li>
      </ul>
    </div>
  </div>
</nav>
<div class="container my-5" style="max-width:700px">
  <h1 class="fw-bold mb-4">About CPT Journal</h1>
  <p class="lead">A travel blog dedicated to Cape Town and the Western Cape.</p>
  <p>From stunning beaches to world-class wine regions, CPT Journal captures the best of the Mother City.</p>
  <hr>
  <h4>The Author</h4>
  <p>Written by <strong>Jihaad Marcus</strong> as part of Task 2 for DLBITPEWP01_E at IU Internationale Hochschule.</p>
  <a href="/" class="btn btn-dark mt-3">Back to blog</a>
</div>
<footer class="bg-dark text-white text-center py-3 mt-5">
  <p class="mb-0 small">2026 CPT Journal | Jihaad Marcus | DLBITPEWP01_E</p>
</footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>""")

# ── admin/login.ejs ────────────────────────────
with open('views/admin/login.ejs', 'w') as f:
    f.write("""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login | CPT Journal</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
<div class="container d-flex justify-content-center align-items-center" style="min-height:100vh">
  <div class="card shadow" style="width:380px">
    <div class="card-body p-4">
      <h4 class="fw-bold mb-1">CPT Journal</h4>
      <p class="text-muted small mb-4">Administrator Login</p>
      <% if (error !== null && error !== undefined && error !== '') { %>
        <div class="alert alert-danger"><%= error %></div>
      <% } %>
      <form method="POST" action="/admin/login">
        <div class="mb-3">
          <label class="form-label">Username</label>
          <input type="text" name="username" class="form-control" required autofocus>
        </div>
        <div class="mb-4">
          <label class="form-label">Password</label>
          <input type="password" name="password" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-dark w-100">Login</button>
      </form>
      <div class="text-center mt-3">
        <a href="/" class="text-muted small">Back to blog</a>
      </div>
    </div>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>""")

# ── admin/dashboard.ejs ────────────────────────
with open('views/admin/dashboard.ejs', 'w') as f:
    f.write("""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard | CPT Journal</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<nav class="navbar navbar-dark bg-dark">
  <div class="container">
    <a class="navbar-brand fw-bold" href="/">CPT Journal</a>
    <div class="d-flex gap-2">
      <a href="/admin/new" class="btn btn-sm btn-success">+ New Post</a>
      <a href="/" class="btn btn-sm btn-outline-light">View Blog</a>
      <a href="/admin/logout" class="btn btn-sm btn-outline-danger">Logout</a>
    </div>
  </div>
</nav>
<div class="container my-5">
  <h2 class="fw-bold mb-4">Admin Dashboard</h2>
  <% if (posts.length === 0) { %>
    <div class="alert alert-info">No posts yet. <a href="/admin/new">Create one</a>.</div>
  <% } else { %>
    <div class="table-responsive">
      <table class="table table-bordered table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th>#</th><th>Title</th><th>Author</th><th>Date</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <% posts.forEach(function(post) { %>
            <tr>
              <td><%= post.id %></td>
              <td><a href="/post/<%= post.id %>" target="_blank"><%= post.title %></a></td>
              <td><%= post.author %></td>
              <td><%= new Date(post.created_at).toLocaleDateString() %></td>
              <td>
                <a href="/admin/edit/<%= post.id %>" class="btn btn-sm btn-outline-primary me-1">Edit</a>
                <form method="POST" action="/admin/delete/<%= post.id %>" class="d-inline"
                      onsubmit="return confirm('Delete this post and all its comments?')">
                  <button type="submit" class="btn btn-sm btn-outline-danger">Delete</button>
                </form>
              </td>
            </tr>
          <% }); %>
        </tbody>
      </table>
    </div>
  <% } %>
</div>
<footer class="bg-dark text-white text-center py-3 mt-5">
  <p class="mb-0 small">2026 CPT Journal | Jihaad Marcus | DLBITPEWP01_E</p>
</footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>""")

# ── admin/form.ejs ─────────────────────────────
with open('views/admin/form.ejs', 'w') as f:
    f.write("""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post Form | CPT Journal</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<nav class="navbar navbar-dark bg-dark">
  <div class="container">
    <a class="navbar-brand fw-bold" href="/">CPT Journal</a>
    <a href="/admin" class="btn btn-sm btn-outline-light">Dashboard</a>
  </div>
</nav>
<div class="container my-5" style="max-width:720px">
  <% if (post) { %>
    <h2 class="fw-bold mb-4">Edit Post</h2>
  <% } else { %>
    <h2 class="fw-bold mb-4">Create New Post</h2>
  <% } %>
  <form method="POST" action="<%= action %>">
    <div class="mb-3">
      <label class="form-label fw-semibold">Title</label>
      <% if (post) { %>
        <input type="text" name="title" class="form-control form-control-lg" required value="<%= post.title %>">
      <% } else { %>
        <input type="text" name="title" class="form-control form-control-lg" required value="">
      <% } %>
    </div>
    <div class="mb-3">
      <label class="form-label fw-semibold">Author</label>
      <% if (post) { %>
        <input type="text" name="author" class="form-control" value="<%= post.author %>">
      <% } else { %>
        <input type="text" name="author" class="form-control" value="Jihaad Marcus">
      <% } %>
    </div>
    <div class="mb-4">
      <label class="form-label fw-semibold">Content</label>
      <% if (post) { %>
        <textarea name="content" class="form-control" rows="12" required><%= post.content %></textarea>
      <% } else { %>
        <textarea name="content" class="form-control" rows="12" required></textarea>
      <% } %>
    </div>
    <div class="d-flex gap-2">
      <% if (post) { %>
        <button type="submit" class="btn btn-dark">Save Changes</button>
      <% } else { %>
        <button type="submit" class="btn btn-dark">Publish Post</button>
      <% } %>
      <a href="/admin" class="btn btn-outline-secondary">Cancel</a>
    </div>
  </form>
</div>
<footer class="bg-dark text-white text-center py-3 mt-5">
  <p class="mb-0 small">2026 CPT Journal | Jihaad Marcus | DLBITPEWP01_E</p>
</footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>""")

# ── public/style.css ───────────────────────────
with open('public/style.css', 'w') as f:
    f.write("""body { font-family: 'Segoe UI', sans-serif; }
.hero { background: linear-gradient(135deg, #0f2027, #203a43, #2c5364); }
.post-card { border-radius: 12px; transition: transform 0.2s, box-shadow 0.2s; }
.post-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
.post-content { font-size: 1.05rem; line-height: 1.8; }
""")

print("All files created successfully.")
print("")
print("views/index.ejs      - Homepage")
print("views/post.ejs       - Post detail + AJAX comments")
print("views/about.ejs      - About page")
print("views/admin/login.ejs     - Admin login")
print("views/admin/dashboard.ejs - Admin post manager")
print("views/admin/form.ejs      - Create and edit posts")
print("public/style.css     - Custom styles")
print("")
print("Run: npm start")