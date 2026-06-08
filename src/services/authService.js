const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createHttpError } = require('../utils/httpError');
const { findUserByEmail, createUser } = require('../repositories/userRepository');

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function createToken(payload) {
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, jwtSecret, { expiresIn });
}

async function registerUser({ username, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const existedUser = await findUserByEmail(normalizedEmail);

  if (existedUser) {
    throw createHttpError(409, 'Email already registered', 40901);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({
    username: String(username).trim(),
    email: normalizedEmail,
    passwordHash,
  });

  const token = createToken({
    userId: user.id,
    email: user.email,
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    token,
  };
}

async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw createHttpError(401, 'Invalid email or password', 40101);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordCorrect) {
    throw createHttpError(401, 'Invalid email or password', 40101);
  }

  const token = createToken({
    userId: user.id,
    email: user.email,
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    token,
  };
}

module.exports = {
  registerUser,
  loginUser,
};
