const express = require('express');
const itemsRouter = express.Router();
const { getAllItems, getItemById } = require('../db/items');
// Import review functions and middleware
const { getReviewsByItemId, createReview } = require('../db/reviews');
const { requireUser } = require('./utils');
// We will need review functions and requireUser later
// const { getReviewsByItemId, createReview } = require('../db/reviews');
// const { requireUser } = require('./utils');

// GET /api/items
itemsRouter.get('/', async (req, res, next) => {
  try {
    const items = await getAllItems();
    res.send({ items });
  } catch (error) {
    next(error);
  }
});

// GET /api/items/:itemId
itemsRouter.get('/:itemId', async (req, res, next) => {
  const { itemId } = req.params;
  try {
    const item = await getItemById(itemId);
    if (!item) {
      return next({
        name: 'ItemNotFoundError',
        message: `Item with ID ${itemId} not found`
      });
    }
    res.send({ item });
  } catch (error) {
    next(error);
  }
});

// --- Reviews for a specific item ---

// GET /api/items/:itemId/reviews
itemsRouter.get('/:itemId/reviews', async (req, res, next) => {
    const { itemId } = req.params;
    try {
        // Check if item exists (optional, but good practice)
        const item = await getItemById(itemId);
        if (!item) {
          return next({
            name: 'ItemNotFoundError',
            message: `Item with ID ${itemId} not found when fetching reviews`
          });
        }
        
        const reviews = await getReviewsByItemId(itemId);
        res.send({ reviews });
    } catch (error) {
        next(error);
    }
});

// POST /api/items/:itemId/reviews
itemsRouter.post('/:itemId/reviews', requireUser, async (req, res, next) => {
    const { itemId } = req.params;
    const { rating, reviewText } = req.body;
    const userId = req.user.id; // Get user ID from authenticated user

    if (rating === undefined || !reviewText) {
        return next({
            name: 'MissingReviewFieldsError',
            message: 'Please provide both rating and reviewText.'
        });
    }

    try {
         // Check if item exists
         const item = await getItemById(itemId);
         if (!item) {
           return next({
             name: 'ItemNotFoundError',
             message: `Item with ID ${itemId} not found when creating review`
           });
         }

        // Attempt to create the review
        const newReview = await createReview({ 
            itemId,
            userId,
            rating,
            reviewText // Ensure DB function uses correct field name (review_text vs reviewText)
        });
        res.status(201).send({ review: newReview });

    } catch (error) {
        // Handle potential unique constraint violation (user already reviewed item)
        if (error.code === '23505') { // PostgreSQL unique violation code
            next({
                name: 'DuplicateReviewError',
                message: 'You have already submitted a review for this item.'
            });
        } else {
            next(error);
        }
    }
});

module.exports = itemsRouter; 