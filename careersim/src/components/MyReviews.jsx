import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyReviews, deleteReview } from '../api'; // Adjust path as needed

// TODO: Add Edit functionality (perhaps a modal or separate edit page)

const MyReviews = ({ user }) => {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        setError('You must be logged in to view your reviews.');
        return;
    }
    const getMyReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchMyReviews();
        if (response && response.data && Array.isArray(response.data.reviews)) {
            setReviews(response.data.reviews);
        } else {
            console.error('Unexpected API response:', response);
            setError('Failed to fetch reviews: Invalid data format.');
            setReviews([]);
        }
      } catch (err) {
        console.error("Error fetching my reviews:", err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch reviews');
        setReviews([]);
      } finally {
          setLoading(false);
      }
    };

    getMyReviews();
  }, [user]); // Re-fetch if user changes (e.g., logout/login)

  const handleDeleteReview = async (reviewId) => {
      if (!window.confirm("Are you sure you want to delete this review?")) return;
      try {
          await deleteReview(reviewId);
          // Remove from local state
          setReviews(prevReviews => prevReviews.filter(r => r.id !== reviewId));
      } catch (error) {
          console.error("Error deleting review:", error);
          alert("Failed to delete review.");
      }
  };

  if (loading) {
      return <p>Loading your reviews...</p>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div>
      <h2>My Reviews</h2>
      {reviews.length === 0 ? (
        <p>You haven't written any reviews yet.</p>
      ) : (
        <ul>
          {reviews.map((review) => (
            <li key={review.id} style={{marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
              <h4>Review for: <Link to={`/items/${review.item_id}`}>{review.item_name || `Item #${review.item_id}`}</Link></h4>
              <p><strong>Rating:</strong> {review.rating}/5</p>
              <p>{review.review_text}</p>
              <p><small><em>Reviewed on: {new Date(review.created_at).toLocaleDateString()}</em></small></p>
              <button onClick={() => handleDeleteReview(review.id)} style={{marginRight: '5px'}}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyReviews; 