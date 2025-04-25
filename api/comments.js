const express = require('express');
const commentsRouter = express.Router();
const { 
    getCommentsByReviewId, 
    createComment, 
    getCommentsByUserId, 
    getCommentById, 
    updateComment, 
    deleteComment 
} = require('../db/comments');
const { getReviewById } = require('../db/reviews');
const { requireUser } = require('./utils');

// --- Nested under Reviews --- 
// (We define this route here but it will be mounted under /api/reviews/:reviewId/comments)

// GET /api/reviews/:reviewId/comments
commentsRouter.get('/forReview/:reviewId', async (req, res, next) => {
    const { reviewId } = req.params;
    try {
        // Optional: Check if review exists first
        const review = await getReviewById(reviewId);
        if (!review) {
            return next({ name: "ReviewNotFoundError", message: `Review ${reviewId} not found` });
        }
        const comments = await getCommentsByUserId(reviewId);
        res.send({ comments });
    } catch (error) {
        next(error);
    }
});

// POST /api/reviews/:reviewId/comments
commentsRouter.post('/forReview/:reviewId', requireUser, async (req, res, next) => {
    const { reviewId } = req.params;
    const { commentText } = req.body;
    const userId = req.user.id;

    if (!commentText) {
        return next({ name: "MissingCommentBodyError", message: "Comment text cannot be empty" });
    }

    try {
         // Optional: Check if review exists first
         const review = await getReviewById(reviewId);
         if (!review) {
             return next({ name: "ReviewNotFoundError", message: `Review ${reviewId} not found` });
         }

        const newComment = await createComment({ reviewId, userId, commentText });
        res.status(201).send({ comment: newComment });
    } catch (error) {
        next(error);
    }
});

// --- Direct Comment Routes (/api/comments) ---

// Middleware to check if the comment exists
async function checkCommentExists(req, res, next) {
    try {
        const comment = await getCommentById(req.params.commentId);
        if (!comment) {
            return next({
                name: "CommentNotFoundError",
                message: `Comment with ID ${req.params.commentId} not found`
            });
        }
        req.comment = comment; // Attach comment to request object
        next();
    } catch (error) {
        next(error);
    }
}

// Middleware to check if the logged-in user owns the comment
function checkCommentOwnership(req, res, next) {
    if (!req.user) {
        return next({ name: "NotLoggedInError", message: "You must be logged in" });
    }
    if (req.comment.user_id !== req.user.id) {
        return next({
            name: "UnauthorizedError",
            message: "You do not have permission to modify this comment"
        });
    }
    next();
}


// GET /api/comments/me
commentsRouter.get('/me', requireUser, async (req, res, next) => {
    try {
        const comments = await getCommentsByUserId(req.user.id);
        res.send({ comments });
    } catch (error) {
        next(error);
    }
});

// PUT /api/comments/:commentId
commentsRouter.put('/:commentId', requireUser, checkCommentExists, checkCommentOwnership, async (req, res, next) => {
    const { commentId } = req.params;
    const { commentText } = req.body;

    if (!commentText || commentText.trim() === '') {
         return next({ name: "MissingCommentBodyError", message: "Comment text cannot be empty" });
    }

    try {
        const updatedComment = await updateComment(commentId, { comment_text: commentText });
        res.send({ comment: updatedComment });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/comments/:commentId
commentsRouter.delete('/:commentId', requireUser, checkCommentExists, checkCommentOwnership, async (req, res, next) => {
    const { commentId } = req.params;
    try {
        const deletedComment = await deleteComment(commentId);
        res.send({ message: "Comment deleted successfully", comment: deletedComment });
    } catch (error) {
        next(error);
    }
});

module.exports = commentsRouter; 