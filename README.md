# Task2-getting-started-with-web-programmingCPTJournal
this is a university assignment where i need to make a fully functional full stack website and the topic for this assignment is a blog platform page, the submission presents the conception phase for task 2, blog-content platform. CPT Journal is a full stack blog web application in which administrator, publishes, edits and deletes travel articles, and visitors being the users will read them and posts comments. The project demonstrates a complete web development stack, a relational SQLite databse, Express.js server and Bootstrap 5 for responsive layout, and a API for comment submission 
Key features: 
Homepage: Displays a number list of posts showing title, excerpt (first 200 characters of content), author, and publication date. The most recent post appears first. 

Post detail page: Shows the full content of a single article accessed via a unique URL (e.g. /post/42). Includes a back-navigation link to the homepage. 

Comments section: Displayed below each post. Visitors enter their name and comment text. Submission is handled asynchronously via the Fetch API; new comments appear without a full page reload. All comments are stored in the database and displayed in chronological order.
Admin post creation:
An admin form to create new posts (no user registration needed — just one hardcoded admin). a simple form (title field + content textarea) allows new posts to be inserted into the database. The admin can also view a list of all posts and delete any post. 
About page: 
A static page describing the blog and the author. 
Edit posts:
to allow users yo modify the piece of content such as posts thats been published, fixing grammar etc
Responsive design: Bootstrap 5 grid and utility classes ensure the site is usable on mobile, tablet, and desktop. 

User Features/Roles: 

Visitor (unauthenticated): Can browse the homepage, read any post, and submit a comment. No account is required. 

Administrator: Accesses /admin can create new posts and delete existing ones following the CRUD term as well as upating/editing posts, the session state is managed via express session. 

Frontend: HTML5, CSS3, Bootstrap 5 — structure, styling, and responsive layout. 

Templating: EJS (Embedded JavaScript) — server-side HTML generation from database data. 

Client scripting: Vanilla JavaScript with the Fetch API — asynchronous comment submission (AJAX). 

Backend: Node.js with Express.js 4 — HTTP routing, middleware, session handling. 

Database: SQLite 3 (via better-sqlite3 npm package) — lightweight relational DB, no separate server required. 

Version control: Git + GitHub — all source code tracked in a public repository. 

Data model: 
The SQLite database contains two tables: posts and comments. A post has a one-to-many(1-n) relationship with comments — one post can have many comments, and each comment belongs to exactly one post (enforced via a foreign key on comments.post_id). The administrator table is not stored in the database; credentials are held in environment variables for simplicity if I plan to make the administrator login access then credentials will be used: 
