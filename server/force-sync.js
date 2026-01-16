import { syncDatabase } from './src/models/index.js';

console.log('--- Database Repair Tool ---');
console.log('Attempting to FORCE synchronize the database schema...');

const success = await syncDatabase(true);

if (success) {
    console.log('✓ Database schema has been reset and updated to latest version.');
    process.exit(0);
} else {
    console.error('✗ Database schema reset failed.');
    process.exit(1);
}
