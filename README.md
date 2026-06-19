# CPT Journal — Blog / Content Platform

> **Course:** Project: Getting Started in Web Programming (DLBITPEWP01\_E)
> **Task:** Task 2 — Blog / Content Platform
> **Student:** Jihaad Marcus


A full-stack travel blog web application built from scratch using Node.js, Express.js, EJS server-side templating, and SQLite. Visitors can browse and read posts and submit comments asynchronously via the Fetch API (AJAX). An administrator can log in to create, edit, and delete posts, and moderate all comments through a protected dashboard.

**Live Repository:** [https://github.com/jihaadM/Task2-getting-started-with-web-programmingCPTJournal](https://github.com/jihaadM/Task2-getting-started-with-web-programmingCPTJournal)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Routes Reference](#routes-reference)
- [Admin Access](#admin-access)
- [CRUD Operations](#crud-operations)
- [Security Notes](#security-notes)

---

## Features

### Visitor (public, no login required)
- Browse a responsive homepage showing all blog posts as cards
- Read individual post detail pages with full article content
- Submit comments on any post via AJAX — page does not reload
- View the About page

### Administrator (login required)
- **Create** new posts via a protected form (`/admin/new`)
- **Read** all posts in a management dashboard (`/admin`)
- **Update** any existing post via a pre-filled edit form (`/admin/edit/:id`)
- **Delete** any post — associated comments are removed automatically via CASCADE DELETE (`/admin/delete/:id`)
- **Moderate comments** — delete any individual comment site-wide from the dashboard or directly from the post page

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js v18+ |
| Web framework | Express.js 4 |
| Templating | EJS (Embedded JavaScript) |
| Database | SQLite 3 via `better-sqlite3` |
| Styling | Bootstrap 5 (loaded via CDN) |
| Client-side scripting | Vanilla JavaScript + Fetch API (AJAX) |
| Session management | `express-session` |
| Environment variables | `dotenv` |
| Version control | Git + GitHub |

---

## Prerequisites

Before you begin, ensure the following tools are installed on your machine:

| Tool | Minimum version | Download |
|------|----------------|----------|
| Node.js (includes npm) | v18.0.0 | [nodejs.org](https://nodejs.org) |
| Git | Any recent version | [git-scm.com](https://git-scm.com) |

Verify your installations by running:

```bash
node --version
npm --version
git --version
```

---

## Installation

### Step 1 — Clone the repository

```bash
git clone https://github.com/jihaadM/Task2-getting-started-with-web-programmingCPTJournal.git
```

### Step 2 — Navigate into the project folder

```bash
cd Task2-getting-started-with-web-programmingCPTJournal/cpt-journal
```

> **Important:** All commands from this point forward must be run from inside the `cpt-journal` folder.

### Step 3 — Install dependencies

```bash
npm install
```

This installs the following packages defined in `package.json`:

| Package | Purpose |
|---------|---------|
| `express` | HTTP server and routing |
| `ejs` | Server-side HTML templating |
| `better-sqlite3` | SQLite database driver |
| `express-session` | Session-based admin authentication |
| `dotenv` | Loads environment variables from `.env` |

### Step 4 — Configure your environment file

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Then open `.env` in a text editor and set your own admin credentials (see [Environment Configuration](#environment-configuration) below).

### Step 5 — Start the server

```bash
npm start
```

You should see:

```
CPT Journal running → http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Configuration

The application reads sensitive configuration from a `.env` file located inside the `cpt-journal/` folder. This file is excluded from Git via `.gitignore` so that credentials are never committed to the repository.

### Required variables

Create a file named `.env` inside `cpt-journal/` with the following content:

```env
# Admin login credentials
ADMIN_USER=your_admin_username
ADMIN_PASS=your_secure_password

# Session signing secret — use a long random string
SESSION_SECRET=replace_this_with_a_long_random_string

# Port the server listens on (optional, defaults to 3000)
PORT=3000
```

An `.env.example` file is included in the repository as a safe template. It contains the same variable names with placeholder values and no real credentials.

### Example `.env.example`

```env
# Copy this file to .env and replace the placeholder values
ADMIN_USER=your_admin_username
ADMIN_PASS=your_secure_password
SESSION_SECRET=replace_this_with_a_long_random_string
PORT=3000
```

> **Never commit your `.env` file to Git.** It is already listed in `.gitignore`.

---

## Running the Application

### Start the development server

```bash
npm start
```

### Stop the server

Press `Ctrl + C` in the terminal.

### Default port

The server runs on port `3000` by default. To use a different port, set `PORT` in your `.env` file:

```env
PORT=8080
```

### Database

The SQLite database file (`journal.db`) is created automatically inside `cpt-journal/` the first time the server starts. Three sample Cape Town travel posts are seeded on first run so the blog has content to display immediately.

You do not need to run any SQL scripts or configure a separate database server.

---

## Project Structure

```
Task2-getting-started-with-web-programmingCPTJournal/
├── cpt-journal/                  ← Main application folder
│   ├── app.js                    ← Express server, all routes, middleware
│   ├── db.js                     ← SQLite database setup and seed data
│   ├── package.json              ← Project metadata and dependencies
│   ├── .env                      ← Your local credentials (NOT in Git)
│   ├── .env.example              ← Safe credential template (in Git)
│   ├── journal.db                ← Auto-generated SQLite database file
│   ├── public/
│   │   └── style.css             ← Custom CSS styles
│   └── views/
│       ├── index.ejs             ← Homepage (post listing)
│       ├── post.ejs              ← Post detail page + comment form
│       ├── about.ejs             ← About page
│       └── admin/
│           ├── login.ejs         ← Admin login form
│           ├── dashboard.ejs     ← Admin post and comment management
│           └── form.ejs          ← Create / edit post form (shared)
├── .gitignore
└── README.md
```

---

## Routes Reference

### Public routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Homepage — lists all posts, newest first |
| GET | `/about` | About page |
| GET | `/post/:id` | Full post detail with comments |
| POST | `/post/:id/comment` | Submit a comment via AJAX (returns JSON) |

### Admin authentication routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/login` | Show the login form |
| POST | `/admin/login` | Validate credentials, create session |
| GET | `/admin/logout` | Destroy session and redirect to homepage |

### Admin CRUD routes (login required)

| Method | Route | Operation | Description |
|--------|-------|-----------|-------------|
| GET | `/admin` | Read | Dashboard — list all posts and comments |
| GET | `/admin/new` | Create | Show blank post form |
| POST | `/admin/new` | Create | Insert new post into database |
| GET | `/admin/edit/:id` | Update | Show pre-filled edit form |
| POST | `/admin/edit/:id` | Update | Update existing post in database |
| POST | `/admin/delete/:id` | Delete | Delete post and its comments (CASCADE) |
| POST | `/admin/comment/delete/:id` | Delete | Delete an individual comment |

---

## Admin Access

1. Navigate to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Enter the username and password you set in your `.env` file
3. You will be redirected to the Admin Dashboard

The admin session expires automatically after **2 hours** of inactivity. Clicking **Logout** in the navigation bar destroys the session immediately.

> Every admin route is protected by the `requireAdmin` middleware in `app.js`. If a visitor tries to access `/admin/*` without an active session, they are redirected to the login page automatically.

---

## CRUD Operations

CPT Journal implements all four CRUD operations for posts:

| Operation | HTTP Method | Route | Where to find it |
|-----------|-------------|-------|-----------------|
| **Create** | POST | `/admin/new` | Click **+ New Post** on the dashboard |
| **Read** | GET | `/` and `/post/:id` | Homepage and individual post pages |
| **Update** | POST | `/admin/edit/:id` | Click **Edit** next to any post on the dashboard |
| **Delete** | POST | `/admin/delete/:id` | Click **Delete** next to any post on the dashboard |

Comment moderation (admin only):

| Operation | Route | Where to find it |
|-----------|-------|-----------------|
| Delete comment | `/admin/comment/delete/:id` | Dashboard comment table **or** inline on any post page (visible only when logged in) |

---

## Security Notes

| Concern | Mitigation |
|---------|-----------|
| XSS (cross-site scripting) | All user input rendered in EJS uses `<%= %>` (HTML-escaped). Comment text is also stripped of HTML tags server-side before storage. |
| SQL injection | All database queries use `better-sqlite3` parameterised prepared statements. No raw string interpolation in SQL. |
| Admin credentials | Stored in `.env` only. Never hardcoded. `.env` is in `.gitignore`. |
| Session security | `express-session` configured with `httpOnly: true` and `sameSite: 'strict'`. Sessions expire after 2 hours. |
| Route protection | All `/admin/*` routes are wrapped by `requireAdmin()` middleware that checks `req.session.isAdmin` before executing any logic. |

---

## Troubleshooting

**`npm start` gives "Missing script: start"**
Make sure you are inside the `cpt-journal/` folder, not the root of the repository.

**`Error: Cannot find module 'better-sqlite3'`**
Run `npm install` inside `cpt-journal/` to install all dependencies.

**Login fails with correct credentials**
Your `.env` file is either missing or is not inside the `cpt-journal/` folder. Re-check [Environment Configuration](#environment-configuration).

**`Error: Failed to lookup view "index"`**
The `views/` folder is missing or empty. Refer to the project structure above and ensure the `.ejs` files are in the correct locations.

---

## Course Information

| Field | Detail |
|-------|--------|
| Course | DLBITPEWP01\_E — Getting Started in Web Programming |
| Task | Task 2 — Blog / Content Platform |
| Phase | Development / Reflection Phase (Phase 2) |
| Student | Jihaad Marcus |