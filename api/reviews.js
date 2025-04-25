const express = require('express');
const reviewsRouter = express.Router();
const { getReviewsByUserId, getReviewById, updateReview, deleteReview } = require('../db/reviews');
const { requireUser } = require('./utils');
const commentsRouterForReview = require('./comments');

// Middleware to check if the review exists
async function checkReviewExists(req, res, next) {
    try {
        const review = await getReviewById(req.params.reviewId);
        if (!review) {
            return next({
                name: "ReviewNotFoundError",
                message: `Review with ID ${req.params.reviewId} not found`
            });
        }
        req.review = review; // Attach review to request object
        next();
    } catch (error) {
        next(error);
    }
}

// Middleware to check if the logged-in user owns the review
function checkReviewOwnership(req, res, next) {
    if (!req.user) {
         // This case should ideally be caught by requireUser first
        return next({ name: "NotLoggedInError", message: "You must be logged in to perform this action" });
    }
    if (req.review.user_id !== req.user.id) {
        return next({
            name: "UnauthorizedError",
            message: "You do not have permission to modify this review"
        });
    }
    next();
}

// GET /api/reviews/me
reviewsRouter.get('/me', requireUser, async (req, res, next) => {
    try {
        const reviews = await getReviewsByUserId(req.user.id);
        res.send({ reviews });
    } catch (error) {
        next(error);
    }
});

// PUT /api/reviews/:reviewId
reviewsRouter.put('/:reviewId', requireUser, checkReviewExists, checkReviewOwnership, async (req, res, next) => {
    const { reviewId } = req.params;
    const { rating, reviewText } = req.body;
    const updateFields = {};

    if (rating !== undefined) {
        updateFields.rating = rating;
    }
    if (reviewText !== undefined) {
        // Ensure the DB function expects `review_text`
        updateFields.review_text = reviewText; 
    }

    // Check if there are any fields to update
    if (Object.keys(updateFields).length === 0) {
        return next({
            name: "NoUpdateFieldsError",
            message: "Please provide rating or reviewText to update."
        });
    }

    try {
        const updatedReview = await updateReview(reviewId, updateFields);
        res.send({ review: updatedReview });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/reviews/:reviewId
reviewsRouter.delete('/:reviewId', requireUser, checkReviewExists, checkReviewOwnership, async (req, res, next) => {
    const { reviewId } = req.params;
    try {
        const deletedReview = await deleteReview(reviewId);
        // deletedReview contains the data of the deleted review
        res.send({ message: "Review deleted successfully", review: deletedReview });
    } catch (error) {
        next(error);
    }
});

// --- Nested Comment Routes --- 
// Mount comment routes under /api/reviews/:reviewId/comments
// Note: The actual route paths are defined within commentsRouter as /forReview/:reviewId
reviewsRouter.use('/:reviewId/comments', (req, res, next) => {
    // Middleware to pass reviewId to the nested router if needed, or just mount
    console.log(`Accessing comments for review ${req.params.reviewId}`);
    // You might attach reviewId to req if commentsRouter needs it directly,
    // but here we rely on the path parameter already being part of the nested route.
    next();
}, commentsRouterForReview); 

module.exports = reviewsRouter; 