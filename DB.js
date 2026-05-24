// db.js — Database setup for CPT Journal
const Database = require('better-sqlite3');
const path     = require('path');

const db = new Database(path.join(__dirname, 'journal.db'));

// Enable foreign key enforcement
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    title      TEXT     NOT NULL,
    content    TEXT     NOT NULL,
    author     TEXT     NOT NULL DEFAULT 'Admin',
    created_at DATETIME DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS comments (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    post_id     INTEGER  NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_name TEXT     NOT NULL,
    body        TEXT     NOT NULL,
    created_at  DATETIME DEFAULT (datetime('now'))
  );
`);

// Seed three sample posts if the database is empty
const count = db.prepare('SELECT COUNT(*) AS c FROM posts').get();
if (count.c === 0) {
  const ins = db.prepare('INSERT INTO posts (title, content, author) VALUES (?, ?, ?)');

  ins.run(
    'Welcome to CPT Journal',
    `Cape Town is one of the most spectacular cities on earth. Nestled between the iconic Table Mountain and two oceans, it offers an extraordinary blend of natural beauty, rich culture, and vibrant city life, full of diversity and good times.\n\nCPT Journal exists to capture the very best of what the Mother City has to offer — from hidden neighbourhood gems to world-famous landmarks. Whether you are a first-time visitor or a lifelong Capetonian, there is always something new to discover.`,
    'Jihaad Marcus'
  );

  ins.run(
    'Top 5 Beaches in Cape Town',
    `Cape Town is blessed with some of the world's most breathtaking coastline. Here are five beaches that deserve a spot on every visitor's list:\n\n1. Clifton Beach — Four sheltered coves with crystal-clear water and a glamorous atmosphere.\n2. Camps Bay — A wide sandy beach flanked by palm trees and the Twelve Apostles mountain range.\n3. Boulders Beach — Home to a thriving colony of African penguins. An unforgettable experience.\n4. Muizenberg Beach — Colourful bathing boxes and gentle waves make it ideal for beginner surfers.\n5. Hout Bay Beach — A working fishing harbour with a warm, village feel and fresh seafood nearby.`,
    'Jihaad Marcus'
  );

  ins.run(
    'Exploring the Cape Winelands',
    `Just an hour's drive from the city, the Cape Winelands feel like a different world entirely. Stellenbosch, Franschhoek, and Paarl are home to hundreds of award-winning estates producing everything from crisp Sauvignon Blancs to rich Cabernet Sauvignons.\n\nVisiting during harvest season (February to April) is a special treat — estates open their cellars for tours, grape-picking activities, and lavish wine-paired lunches. Even outside harvest season, the architecture, mountain scenery, and cuisine alone make the Winelands an unmissable day trip from Cape Town.`,
    'Jihaad Marcus'
  );
}

module.exports = db;