const sqlite3 = require('sqlite3').verbose();

// Create connection to the database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if(err){
        console.error('Error connecting to the SQLite database:', err.message);
    }else{
        console.log('Connected to SQLite database.');
    }
});

// Create users table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    );
`);

module.exports = db;