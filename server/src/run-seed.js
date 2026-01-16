import { testConnection } from './config/database.js';
import { syncDatabase } from './models/index.js';
import { seedDatabase } from './seed.js';

async function run() {
    await testConnection();
    await syncDatabase(false);
    await seedDatabase();
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
