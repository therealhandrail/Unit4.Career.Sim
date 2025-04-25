const express = require('express');
const apiRouter = express.Router();

// Mount individual routers
const authRouter = require('./auth');
apiRouter.use('/auth', authRouter);

// Mount items router
const itemsRouter = require('./items');
apiRouter.use('/items', itemsRouter);

// Mount reviews router
const reviewsRouter = require('./reviews');
apiRouter.use('/reviews', reviewsRouter);

// Mount comments router
const commentsRouter = require('./comments');
apiRouter.use('/comments', commentsRouter);

// Mount other routers here (e.g., comments)

apiRouter.use((error, req, res, next) => {
  console.error("API Router Error:", error);
  res.status(500).send({ message: 'Internal API error', error: error.message });
});

module.exports = apiRouter; 