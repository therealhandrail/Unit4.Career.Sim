const express = require('express');
const authRouter = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const { getUserByUsername, createUser, getUser } = require('../db/users');
const { requireUser } = require('./utils');

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in your .env file');
}

// POST /api/auth/register
authRouter.post('/register', async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next({
      name: 'MissingCredentialsError',
      message: 'Please provide both username and password.'
    });
  }

  // Simple password validation (example)
  if (password.length < 8) {
    return next({
        name: 'PasswordTooShortError',
        message: 'Password must be at least 8 characters long.'
      });
  }

  try {
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return next({
        name: 'UserExistsError',
        message: `User ${username} is already taken.`
      });
    }

    const newUser = await createUser({ username, password });

    const token = jwt.sign(
        { id: newUser.id, username: newUser.username }, 
        JWT_SECRET, 
        { expiresIn: '1w' } // Token expires in 1 week
    );

    res.send({ 
        message: "Registration successful!",
        token,
        user: newUser // Send back user info (without password)
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next({
      name: 'MissingCredentialsError',
      message: 'Please provide both username and password.'
    });
  }

  try {
    const user = await getUser({ username, password });

    if (!user) {
       return next({
        name: 'InvalidCredentialsError',
        message: 'Invalid username or password.'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '1w' }
    );

    res.send({ 
        message: "Login successful!",
        token,
        user // User object (without password) returned by getUser
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
authRouter.get('/me', requireUser, (req, res, next) => {
  // requireUser middleware attaches the user object to req.user
  res.send(req.user);
});

module.exports = authRouter; 