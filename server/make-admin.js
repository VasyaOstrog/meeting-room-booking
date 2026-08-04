const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'meeting-room-booking.sqlite');
const db = new Database(dbPath);

// Update first user to be admin
db.prepare('UPDATE users SET is_admin = 1 WHERE id = 1').run();

console.log('✓ Updated user with id=1 to admin');

console.log('\n=== UPDATED USERS ===');
const users = db.prepare('SELECT id, name, email, is_admin FROM users').all();
console.table(users);

db.close();
