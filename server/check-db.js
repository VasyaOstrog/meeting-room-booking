const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'meeting-room-booking.sqlite');
const db = new Database(dbPath);

console.log('=== USERS ===');
const users = db.prepare('SELECT id, name, email, is_admin FROM users').all();
console.table(users);

console.log('\n=== ROOMS ===');
const rooms = db.prepare('SELECT id, name, floor, capacity FROM rooms').all();
console.table(rooms);

db.close();
