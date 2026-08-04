/** Registered employee who can create and cancel their own bookings. */
export interface User {
  /** Unique identifier. */
  id: number;
  /** Display name shown on bookings (required, non-empty). */
  name: string;
  /** Login email address (unique across users). */
  email: string;
  /** Bcrypt/argon2 hash; never store plain-text passwords. */
  passwordHash: string;
  /** User role, true when administrator. */
  isAdmin: boolean;
  /** Account creation timestamp in UTC (ISO 8601). */
  createdAt: string;
}

/** Fields required to register a new user. */
export interface NewUser {
  name: string;
  email: string;
  password: string;
}

export const USER_TABLE = 'users';

export const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${USER_TABLE} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`;
