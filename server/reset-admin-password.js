const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'meeting-room-booking.sqlite');
const db = new Database(dbPath);

function hashPassword(password) {
  const SALT_LENGTH = 16;
  const KEY_LENGTH = 64;
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString('hex')}`;
}

const password = 'admin123';
const hash = hashPassword(password);

db.prepare('UPDATE users SET password_hash = ? WHERE id = 1').run(hash);

console.log('✓ Updated admin password to: admin123');
console.log('✓ Email: test@example.com');

db.close();
