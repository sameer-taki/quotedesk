import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('data/quoteforge.sqlite');
const db = new sqlite3.Database(dbPath);

// SQLite doesn't support ALTER COLUMN, so we need to recreate the table
db.serialize(() => {
    console.log('Starting table migration...');

    // Create new table with correct schema
    db.run(`CREATE TABLE users_new (
        id UUID UNIQUE PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        is_active TINYINT(1) DEFAULT 1,
        last_login_at DATETIME,
        password_reset_token VARCHAR(255),
        password_reset_expires DATETIME,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        invitation_token VARCHAR(255),
        invitation_expires DATETIME
    )`, (err) => {
        if (err) {
            console.error('Error creating new table:', err);
            return;
        }
        console.log('Created new table with nullable password_hash');

        // Copy data
        db.run(`INSERT INTO users_new SELECT * FROM users`, (err) => {
            if (err) {
                console.error('Error copying data:', err);
                return;
            }
            console.log('Copied data to new table');

            // Drop old table
            db.run(`DROP TABLE users`, (err) => {
                if (err) {
                    console.error('Error dropping old table:', err);
                    return;
                }
                console.log('Dropped old table');

                // Rename new table
                db.run(`ALTER TABLE users_new RENAME TO users`, (err) => {
                    if (err) {
                        console.error('Error renaming table:', err);
                        return;
                    }
                    console.log('Renamed new table to users');
                    console.log('Migration complete!');
                    db.close();
                });
            });
        });
    });
});
