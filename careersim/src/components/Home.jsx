import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllItems } from '../api'; // Adjust path as needed

const Home = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getItems = async () => {
      try {
        const response = await fetchAllItems();
        console.log('API Response:', response);
        // Ensure response.data.items exists and is an array
        if (response && response.data && Array.isArray(response.data.items)) {
            setItems(response.data.items);
        } else {
            console.error('Unexpected API response structure:', response);
            setError('Failed to fetch items: Invalid data format.');
            setItems([]); // Set to empty array on error
        }
      } catch (err) {
        console.error("Error fetching items:", err);
        setError(err.message || 'Failed to fetch items');
        setItems([]); // Set to empty array on error
      }
    };

    getItems();
  }, []);

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div>
      <h2>All Items</h2>
      {items.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <Link to={`/items/${item.id}`}>
                <h3>{item.name}</h3>
              </Link>
              <p>{item.description}</p>
              <p>Category: {item.category}</p>
              <p>Average Rating: {item.average_rating.toFixed(1)} ({item.review_count} reviews)</p>
              {/* TODO: Add Search functionality later */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Home; 