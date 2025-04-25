const client = require('./client');

const { createItem } = require('./seed'); 

async function getAllItems() {
  try {
    const { rows: items } = await client.query(`
      SELECT 
        items.*,
        COALESCE(AVG(reviews.rating), 0) AS average_rating,
        COUNT(reviews.id) AS review_count
      FROM items
      LEFT JOIN reviews ON items.id = reviews.item_id
      GROUP BY items.id
      ORDER BY items.created_at DESC;
    `);
    
    return items.map(item => ({
        ...item,
        average_rating: parseFloat(item.average_rating)
    }));
  } catch (error) {
    console.error('Error getting all items:', error);
    throw error;
  }
}

async function getItemById(itemId) {
  try {
    const { rows: [item] } = await client.query(`
      SELECT 
        items.*,
        COALESCE(AVG(reviews.rating), 0) AS average_rating,
        COUNT(reviews.id) AS review_count
      FROM items
      LEFT JOIN reviews ON items.id = reviews.item_id
      WHERE items.id = $1
      GROUP BY items.id;
    `, [itemId]);

    if (!item) {
      return null;
    }

    item.average_rating = parseFloat(item.average_rating);

    return item;
  } catch (error) {
    console.error(`Error getting item by ID ${itemId}:`, error);
    throw error;
  }
}

module.exports = {
  createItem,
  getAllItems,
  getItemById,
}; 