const client = require('./client');

const { createComment } = require('./seed');

async function getCommentsByReviewId(reviewId) {
  try {
    const { rows: comments } = await client.query(`
      SELECT comments.*, users.username AS author_username
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.review_id = $1
      ORDER BY comments.created_at ASC;
    `, [reviewId]);
    return comments;
  } catch (error) {
    console.error(`Error getting comments for review ${reviewId}:`, error);
    throw error;
  }
}

async function getCommentById(commentId) {
    try {
        const { rows: [comment] } = await client.query(`
            SELECT comments.*, users.username AS author_username
            FROM comments
            JOIN users ON comments.user_id = users.id
            WHERE comments.id = $1;
        `, [commentId]);
        return comment;
    } catch (error) {
        console.error(`Error getting comment ${commentId}:`, error);
        throw error;
    }
}

async function getCommentsByUserId(userId) {
  try {
    const { rows: comments } = await client.query(`
        SELECT 
            comments.*, 
            reviews.item_id, 
            items.name as item_name
        FROM comments
        JOIN users ON comments.user_id = users.id
        JOIN reviews ON comments.review_id = reviews.id
        JOIN items ON reviews.item_id = items.id
        WHERE comments.user_id = $1
        ORDER BY comments.created_at DESC;
    `, [userId]);
    return comments;
  } catch (error) {
    console.error(`Error getting comments for user ${userId}:`, error);
    throw error;
  }
}

async function updateComment(commentId, fields = {}) {
    const { comment_text } = fields;
    
    if (comment_text === undefined || comment_text.trim() === '') {
        return await getCommentById(commentId); 
    }

    try {
        const { rows: [comment] } = await client.query(`
            UPDATE comments
            SET comment_text = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `, [commentId, comment_text]);
        return comment;
    } catch (error) {
        console.error(`Error updating comment ${commentId}:`, error);
        throw error;
    }
}

async function deleteComment(commentId) {
    try {
        const { rows: [deletedComment] } = await client.query(`
            DELETE FROM comments
            WHERE id = $1
            RETURNING *;
        `, [commentId]);
        return deletedComment;
    } catch (error) {
        console.error(`Error deleting comment ${commentId}:`, error);
        throw error;
    }
}

module.exports = {
  createComment,
  getCommentsByReviewId,
  getCommentById,
  getCommentsByUserId,
  updateComment,
  deleteComment,
}; 