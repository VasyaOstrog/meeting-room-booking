import { Router } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { updateUser, changeUserPassword, deleteUser, getUserById } from '../../services/users.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateProfileUpdate(body: unknown): { name?: string; email?: string } {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const payload = body as Record<string, unknown>;
  const updates: { name?: string; email?: string } = {};

  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (name.length < 1) {
      throw new Error('Name cannot be empty');
    }
    updates.name = name;
  }

  if (payload.email !== undefined) {
    const email = String(payload.email).trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      throw new Error('Email must be valid');
    }
    updates.email = email;
  }

  return updates;
}

function validatePasswordChange(body: unknown): { currentPassword: string; newPassword: string; confirmPassword: string } {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const payload = body as Record<string, unknown>;
  const currentPassword = String(payload.currentPassword ?? '');
  const newPassword = String(payload.newPassword ?? '');
  const confirmPassword = String(payload.confirmPassword ?? '');

  if (currentPassword.length === 0) {
    throw new Error('Current password is required');
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters');
  }

  if (newPassword !== confirmPassword) {
    throw new Error('New password and confirmation do not match');
  }

  return { currentPassword, newPassword, confirmPassword };
}

export const profileRouter = Router();

// Get user profile
profileRouter.get('/', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const user = getUserById(authReq.user.userId);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
  });
});

// Update profile
profileRouter.patch('/', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const updates = validateProfileUpdate(req.body);
    const user = updateUser(authReq.user.userId, updates);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update profile' });
  }
});

// Change password
profileRouter.post('/password', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const { currentPassword, newPassword } = validatePasswordChange(req.body);
    changeUserPassword(authReq.user.userId, currentPassword, newPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to change password' });
  }
});

// Delete account
profileRouter.delete('/', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    deleteUser(authReq.user.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete account' });
  }
});
