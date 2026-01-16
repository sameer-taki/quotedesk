import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('data/quoteforge.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, email, name, role, is_active, invitation_token IS NOT NULL as has_token FROM users ORDER BY created_at DESC", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('All users:');
        console.table(rows);
    }
    db.close();
});
