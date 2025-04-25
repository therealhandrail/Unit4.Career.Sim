const client = require('./client');
const bcrypt = require('bcrypt');

const { createUser } = require('./seed'); 

async function getUser({ username, password }) {
  try {
    const user = await getUserByUsername(username);
    if (!user) {
      return null;
    }

    const hashedPassword = user.password;
    const passwordsMatch = await bcrypt.compare(password, hashedPassword);

    if (passwordsMatch) {
      delete user.password;
      return user;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

async function getUserById(userId) {
  try {
    const { rows: [user] } = await client.query(`
      SELECT id, username, created_at
      FROM users
      WHERE id=$1;
    `, [userId]);

    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    const { rows: [user] } = await client.query(`
      SELECT *
      FROM users
      WHERE username=$1;
    `, [username]);

    return user;
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
}

module.exports = {
  createUser,
  getUser,
  getUserById,
  getUserByUsername,
}; 