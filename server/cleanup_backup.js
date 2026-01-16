import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('data/quoteforge.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS users_backup", (err) => {
        if (err) console.error('Error dropping backup:', err);
        else console.log('Dropped users_backup table');
        db.close();
    });
});
