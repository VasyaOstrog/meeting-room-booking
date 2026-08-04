import { getDatabase } from '../config/database';
import { User, USER_TABLE, NewUser } from '../models';
import { hashPassword, verifyPassword } from '../utils/auth';

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  is_admin: number;
  created_at: string;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    isAdmin: row.is_admin === 1,
    createdAt: row.created_at,
  };
}

export function getUserByEmail(email: string): User | null {
  const db = getDatabase();
  const row = db
    .prepare(`SELECT id, name, email, password_hash, is_admin, created_at FROM ${USER_TABLE} WHERE email = ?`)
    .get(email) as UserRow | undefined;

  return row ? mapUser(row) : null;
}

export function getUserById(id: number): User | null {
  const db = getDatabase();
  const row = db
    .prepare(`SELECT id, name, email, password_hash, is_admin, created_at FROM ${USER_TABLE} WHERE id = ?`)
    .get(id) as UserRow | undefined;

  return row ? mapUser(row) : null;
}

export function getUserCount(): number {
  const db = getDatabase();
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${USER_TABLE}`).get() as { count: number };
  return row.count;
}

export function createUser(payload: NewUser, isAdmin = false): User {
  const db = getDatabase();
  const existing = getUserByEmail(payload.email);

  if (existing) {
    throw new Error('A user with this email already exists');
  }

  const passwordHash = hashPassword(payload.password);
  const result = db
    .prepare(
      `INSERT INTO ${USER_TABLE} (name, email, password_hash, is_admin) VALUES (?, ?, ?, ?)`,
    )
    .run(payload.name, payload.email, passwordHash, isAdmin ? 1 : 0);

  const row = db
    .prepare(
      `SELECT id, name, email, password_hash, is_admin, created_at FROM ${USER_TABLE} WHERE id = ?`,
    )
    .get(result.lastInsertRowid) as UserRow;

  return mapUser(row);
}

export function verifyUserCredentials(email: string, password: string): User | null {
  const user = getUserByEmail(email);

  if (!user) {
    return null;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return user;
}

export function updateUser(userId: number, updates: { name?: string; email?: string }): User {
  const db = getDatabase();
  const user = getUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (updates.email && updates.email !== user.email) {
    const existing = getUserByEmail(updates.email);
    if (existing) {
      throw new Error('A user with this email already exists');
    }
  }

  const name = updates.name ?? user.name;
  const email = updates.email ?? user.email;

  db.prepare(`UPDATE ${USER_TABLE} SET name = ?, email = ? WHERE id = ?`).run(name, email, userId);

  return getUserById(userId)!;
}

export function changeUserPassword(userId: number, currentPassword: string, newPassword: string): void {
  const db = getDatabase();
  const user = getUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw new Error('Current password is incorrect');
  }

  const newPasswordHash = hashPassword(newPassword);
  db.prepare(`UPDATE ${USER_TABLE} SET password_hash = ? WHERE id = ?`).run(newPasswordHash, userId);
}

export function deleteUser(userId: number): void {
  const db = getDatabase();
  const user = getUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Delete user's bookings first
  db.prepare(`DELETE FROM bookings WHERE user_id = ?`).run(userId);

  // Delete user
  db.prepare(`DELETE FROM ${USER_TABLE} WHERE id = ?`).run(userId);
}
