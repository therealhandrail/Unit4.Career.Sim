const client = require('./client');

const { createReview } = require('./seed'); 

async function getReviewsByItemId(itemId) {
  try {
    const { rows: reviews } = await client.query(`
      SELECT reviews.*, users.username AS author_username
      FROM reviews
      JOIN users ON reviews.user_id = users.id
      WHERE reviews.item_id = $1
      ORDER BY reviews.created_at DESC;
    `, [itemId]);
    return reviews;
  } catch (error) {
    console.error(`Error getting reviews for item ${itemId}:`, error);
    throw error;
  }
}

async function getReviewById(reviewId) {
    try {
        const { rows: [review] } = await client.query(`
            SELECT reviews.*, users.username AS author_username
            FROM reviews
            JOIN users ON reviews.user_id = users.id
            WHERE reviews.id = $1;
        `, [reviewId]);
        return review;
    } catch (error) {
        console.error(`Error getting review ${reviewId}:`, error);
        throw error;
    }
}

async function getReviewsByUserId(userId) {
  try {
    const { rows: reviews } = await client.query(`
      SELECT reviews.*, items.name AS item_name 
      FROM reviews
      JOIN items ON reviews.item_id = items.id
      WHERE reviews.user_id = $1
      ORDER BY reviews.created_at DESC;
    `, [userId]);
    return reviews;
  } catch (error) {
    console.error(`Error getting reviews for user ${userId}:`, error);
    throw error;
  }
}

async function updateReview(reviewId, fields = {}) {
    const { rating, review_text } = fields;
    const setClauses = [];
    const values = [reviewId];
    let argCount = 2;

    if (rating !== undefined) {
        values.push(rating);
        setClauses.push(`rating = $${argCount++}`);
    }
    if (review_text !== undefined) {
        values.push(review_text);
        setClauses.push(`review_text = $${argCount++}`);
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    if (setClauses.length === 1) {
    }
    
    const setString = setClauses.join(', ');

    if (setString.length === 0) {
        return await getReviewById(reviewId);
    }

    try {
        const { rows: [review] } = await client.query(`
            UPDATE reviews
            SET ${setString}
            WHERE id = $1
            RETURNING *;
        `, values);
        return review;
    } catch (error) {
        console.error(`Error updating review ${reviewId}:`, error);
        throw error;
    }
}

async function deleteReview(reviewId) {
    try {
        const { rows: [deletedReview] } = await client.query(`
            DELETE FROM reviews
            WHERE id = $1
            RETURNING *;
        `, [reviewId]);
        return deletedReview;
    } catch (error) {
        console.error(`Error deleting review ${reviewId}:`, error);
        throw error;
    }
}

module.exports = {
  createReview,
  getReviewsByItemId,
  getReviewById,
  getReviewsByUserId,
  updateReview,
  deleteReview,
}; 