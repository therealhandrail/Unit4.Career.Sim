const client = require('./client');
const bcrypt = require('bcrypt');
const SALT_COUNT = 10;


async function dropTables() {
  console.log('Dropping tables...');
  try {
    await client.query(`
      DROP TABLE IF EXISTS comments;
      DROP TABLE IF EXISTS reviews;
      DROP TABLE IF EXISTS items;
      DROP TABLE IF EXISTS users;
    `);
    console.log('Tables dropped successfully!');
  } catch (error) {
    console.error('Error dropping tables:', error);
    throw error;
  }
}

async function createTables() {
  console.log('Creating tables...');
  try {
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES items(id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(item_id, user_id)
      );

      CREATE TABLE comments (
        id SERIAL PRIMARY KEY,
        review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}


async function createUser({ username, password }) {
  const hashedPassword = await bcrypt.hash(password, SALT_COUNT);
  try {
    const { rows: [user] } = await client.query(`
      INSERT INTO users(username, password)
      VALUES($1, $2)
      ON CONFLICT (username) DO NOTHING
      RETURNING *;
    `, [username, hashedPassword]);
    
    delete user.password;
    return user;
  } catch (error) {
    console.error(`Error creating user ${username}:`, error);
    throw error;
  }
}

async function createItem({ name, description, category }) {
  try {
    const { rows: [item] } = await client.query(`
      INSERT INTO items(name, description, category)
      VALUES($1, $2, $3)
      RETURNING *;
    `, [name, description, category]);
    return item;
  } catch (error) {
    console.error(`Error creating item ${name}:`, error);
    throw error;
  }
}

async function createReview({ itemId, userId, rating, reviewText }) {
  try {
    const { rows: [review] } = await client.query(`
      INSERT INTO reviews(item_id, user_id, rating, review_text)
      VALUES($1, $2, $3, $4)
      RETURNING *;
    `, [itemId, userId, rating, reviewText]);
    return review;
  } catch (error) {
    console.error(`Error creating review for item ${itemId} by user ${userId}:`, error);
    throw error;
  }
}

async function createComment({ reviewId, userId, commentText }) {
  try {
    const { rows: [comment] } = await client.query(`
      INSERT INTO comments(review_id, user_id, comment_text)
      VALUES($1, $2, $3)
      RETURNING *;
    `, [reviewId, userId, commentText]);
    return comment;
  } catch (error) {
    console.error(`Error creating comment for review ${reviewId} by user ${userId}:`, error);
    throw error;
  }
}

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Database connected.');

    await dropTables();
    await createTables();

    console.log('Creating users...');
    const alice = await createUser({ username: 'alice', password: 'password123' });
    const bob = await createUser({ username: 'bob', password: 'password456' });
    const charlie = await createUser({ username: 'charlie', password: 'password789' });
    console.log('Users created:', alice, bob, charlie);

    console.log('Creating items...');
    const book1 = await createItem({ name: 'The Great Novel', description: 'A truly captivating story.', category: 'Book' });
    const restaurant1 = await createItem({ name: 'Tasty Bites Cafe', description: 'Cozy place with great coffee.', category: 'Restaurant' });
    const product1 = await createItem({ name: 'Super Gadget X', description: 'The latest and greatest gadget.', category: 'Product' });
    console.log('Items created:', book1, restaurant1, product1);

    console.log('Creating reviews...');
    const review1 = await createReview({ itemId: book1.id, userId: alice.id, rating: 5, reviewText: 'Absolutely loved this book!' });
    const review2 = await createReview({ itemId: restaurant1.id, userId: bob.id, rating: 4, reviewText: 'Good food, nice atmosphere.' });
    const review3 = await createReview({ itemId: book1.id, userId: bob.id, rating: 4, reviewText: 'A solid read, recommended.' });
    const review4 = await createReview({ itemId: product1.id, userId: charlie.id, rating: 3, reviewText: 'It works, but has some flaws.' });
    const review5 = await createReview({ itemId: restaurant1.id, userId: alice.id, rating: 5, reviewText: 'Best coffee in town!' });
    console.log('Reviews created:', review1, review2, review3, review4, review5);

    console.log('Creating comments...');
    const comment1 = await createComment({ reviewId: review1.id, userId: bob.id, commentText: 'I agree, it was fantastic!' });
    const comment2 = await createComment({ reviewId: review2.id, userId: alice.id, commentText: 'Did you try their pastries?' });
    const comment3 = await createComment({ reviewId: review1.id, userId: charlie.id, commentText: 'Putting it on my reading list.' });
    console.log('Comments created:', comment1, comment2, comment3);

    console.log('Database seeding finished successfully!');

  } catch (error) {
    console.error('Database seeding failed:', error);
  } finally {
    console.log('Closing database connection...');
    await client.end();
    console.log('Database connection closed.');
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  dropTables,
  createTables,
  createUser,
  createItem,
  createReview,
  createComment,
}; 