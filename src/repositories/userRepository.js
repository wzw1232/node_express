const { getMysqlPool } = require('../db/mysql');
const { createHttpError } = require('../utils/httpError');

async function findUserByEmail(email) {
  const pool = getMysqlPool();
  const [rows] = await pool.execute(
    'SELECT id, username, email, password_hash AS passwordHash FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function createUser({ username, email, passwordHash }) {
  const pool = getMysqlPool();
  let result;
  try {
    [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      throw createHttpError(409, '邮箱已被注册', 40901);
    }
    throw error;
  }

  return {
    id: String(result.insertId),
    username,
    email,
  };
}

module.exports = {
  findUserByEmail,
  createUser,
};
