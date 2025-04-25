const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const { getUserById } = require('../db/users');

// Middleware to check for valid JWT and attach user to req
async function requireUser(req, res, next) {
  const prefix = 'Bearer ';
  const auth = req.header('Authorization');

  if (!auth) {
    return next(); // Proceed without user attached
  }

  if (!auth.startsWith(prefix)) {
    return next({
      name: 'AuthorizationHeaderError',
      message: `Authorization token must start with ${prefix}`
    });
  }

  const token = auth.slice(prefix.length);

  try {
    const { id } = jwt.verify(token, JWT_SECRET);

    if (id) {
      const user = await getUserById(id);
      if (user) {
        req.user = user; // Attach user object (without password) to request
      } else {
        // User referenced by token not found (e.g., deleted)
        return next({
            name: 'InvalidTokenError',
            message: 'User associated with token not found'
          });
      }
      next();
    } else {
        next({
            name: 'InvalidTokenError',
            message: 'Invalid token structure'
          });
    }
  } catch ({ name, message }) {
    // Handle JWT errors (e.g., expired, malformed)
    next({ name, message });
  }
}

module.exports = {
  requireUser
}; 