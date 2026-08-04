import { Router } from 'express';
import { createUser, getUserCount, verifyUserCredentials } from '../../services/users.service';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { signAuthToken } from '../../utils/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterInput(body: unknown): { name: string; email: string; password: string } {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const payload = body as Record<string, unknown>;
  const name = String(payload.name ?? '').trim();
  const email = String(payload.email ?? '').trim().toLowerCase();
  const password = String(payload.password ?? '');

  if (name.length < 1) {
    throw new Error('Name is required');
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('Email must be valid');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  return { name, email, password };
}

function validateLoginInput(body: unknown): { email: string; password: string } {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const payload = body as Record<string, unknown>;
  const email = String(payload.email ?? '').trim().toLowerCase();
  const password = String(payload.password ?? '');

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('Email must be valid');
  }

  if (password.length === 0) {
    throw new Error('Password is required');
  }

  return { email, password };
}

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  try {
    const { name, email, password } = validateRegisterInput(req.body);
    const isAdmin = getUserCount() === 0;
    const user = createUser({ name, email, password }, isAdmin);
    const token = signAuthToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin });

    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to register user' });
  }
});

authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = validateLoginInput(req.body);
    const user = verifyUserCredentials(email, password);

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = signAuthToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to login' });
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  res.json({
    user: {
      id: authReq.user.userId,
      email: authReq.user.email,
      isAdmin: authReq.user.isAdmin,
    },
  });
});

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    isAdmin: boolean;
  };
}
