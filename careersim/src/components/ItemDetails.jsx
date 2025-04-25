import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    fetchItemById, 
    fetchReviewsForItem, 
    postReview, 
    deleteReview, 
    fetchCommentsForReview, 
    postComment, 
    deleteComment 
} from '../api';

const CommentList = ({ comments, user, onDeleteComment }) => {
    if (!comments || comments.length === 0) {
        return <p style={{marginLeft: '20px'}}><em>No comments yet.</em></p>;
    }
    return (
        <ul style={{marginLeft: '20px', borderLeft: '1px solid #ccc', paddingLeft: '10px'}}>
            {comments.map(comment => (
                <li key={comment.id}>
                    <p>{comment.comment_text}</p>
                    <p><small><em>by {comment.author_username} on {new Date(comment.created_at).toLocaleDateString()}</em></small></p>
                    {/* Show delete button if user owns the comment */}
                    {user && user.id === comment.user_id && (
                        <button onClick={() => onDeleteComment(comment.id)} style={{fontSize: '0.8em', padding: '2px 5px'}}>
                            Delete Comment
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
}

const CommentForm = ({ reviewId, user, onCommentSubmitSuccess }) => {
    const [commentText, setCommentText] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    if (!user) return null; // Don't show form if not logged in

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!commentText.trim()) {
            setError('Comment cannot be empty.');
            return;
        }
        setSubmitting(true);
        try {
            const response = await postComment(reviewId, { commentText });
            if (response && response.data && response.data.comment) {
                onCommentSubmitSuccess(reviewId, response.data.comment); // Pass reviewId and new comment up
                setCommentText(''); // Clear form
            } else {
                throw new Error('Failed to post comment. Unexpected response.');
            }
        } catch (err) {
            console.error("Error posting comment:", err);
            setError(err.response?.data?.message || err.message || 'Failed to submit comment.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{marginLeft: '20px', marginTop: '10px'}}>
            {error && <p style={{ color: 'red', fontSize: '0.9em' }}>{error}</p>}
            <textarea 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={2}
                required
                style={{width: '80%', marginRight: '5px'}}
            />
            <button type="submit" disabled={submitting} style={{verticalAlign: 'top'}}>
                {submitting ? 'Posting...' : 'Post'}
            </button>
        </form>
    );
}

const ReviewList = ({ reviews, user, onDeleteReview, onCommentSubmitSuccess, commentsByReviewId, setCommentsByReviewId }) => {
    
    useEffect(() => {
        // Fetch comments for reviews that don't have them yet
        reviews.forEach(review => {
            if (!commentsByReviewId[review.id]) {
                fetchCommentsForReview(review.id)
                    .then(response => {
                        if (response && response.data && Array.isArray(response.data.comments)) {
                            setCommentsByReviewId(prev => ({ ...prev, [review.id]: response.data.comments }));
                        } else {
                             setCommentsByReviewId(prev => ({ ...prev, [review.id]: [] })); // Mark as fetched (empty)
                        }
                    })
                    .catch(err => {
                        console.error(`Error fetching comments for review ${review.id}:`, err);
                        setCommentsByReviewId(prev => ({ ...prev, [review.id]: [] })); // Mark as fetched (error)
                    });
            }
        });
    }, [reviews, commentsByReviewId, setCommentsByReviewId]); // Rerun if reviews change

    const handleDeleteComment = async (reviewId, commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await deleteComment(commentId);
            // Update local state to remove the comment
            setCommentsByReviewId(prev => ({
                ...prev,
                [reviewId]: prev[reviewId].filter(c => c.id !== commentId)
            }));
        } catch (error) {
            console.error("Error deleting comment:", error);
            alert("Failed to delete comment."); // Simple error feedback
        }
    };

    if (!reviews || reviews.length === 0) {
        return <p>No reviews yet.</p>;
    }

    return (
        <div>
            <h4>Reviews</h4>
            <ul>
                {reviews.map(review => (
                    <li key={review.id} style={{marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
                        <p><strong>Rating:</strong> {review.rating}/5</p>
                        <p>{review.review_text}</p>
                        <p><em>by {review.author_username} on {new Date(review.created_at).toLocaleDateString()}</em></p>
                        {/* Show delete button if user owns the review */}
                        {user && user.id === review.user_id && (
                            <button onClick={() => onDeleteReview(review.id)} style={{fontSize: '0.8em', padding: '2px 5px', marginRight:'5px'}}>
                                Delete Review
                            </button>
                        )}
                        
                        {/* Comments Section */}
                        <h5>Comments:</h5>
                        <CommentList 
                            comments={commentsByReviewId[review.id]} 
                            user={user} 
                            onDeleteComment={(commentId) => handleDeleteComment(review.id, commentId)}
                        />
                        {/* Only show comment form if user is logged in */} 
                        {user && 
                            <CommentForm 
                                reviewId={review.id} 
                                user={user} 
                                onCommentSubmitSuccess={onCommentSubmitSuccess} 
                            />
                        }
                    </li>
                ))}
            </ul>
        </div>
    );
}

const ReviewForm = ({ itemId, onSubmitSuccess }) => {
    const [rating, setRating] = useState(5); // Default rating
    const [reviewText, setReviewText] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!reviewText || rating < 1 || rating > 5) {
            setError('Please provide valid review text and a rating between 1 and 5.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await postReview(itemId, { rating, reviewText });
            if (response && response.data && response.data.review) {
                onSubmitSuccess(response.data.review); // Pass the new review up

                setReviewText('');
                setRating(5);
            } else {
                throw new Error('Failed to post review. Unexpected response.');
            }
        } catch (err) {
            console.error("Error posting review:", err);
            const errMsg = err.response?.data?.message || err.message || 'Failed to submit review.';
            setError(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h4>Write or Update Your Review</h4>
            <form onSubmit={handleSubmit}>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div>
                    <label htmlFor="rating">Rating (1-5):</label>
                    <input 
                        type="number" 
                        id="rating"
                        value={rating}
                        onChange={(e) => setRating(parseInt(e.target.value, 10))}
                        min="1"
                        max="5"
                        required 
                    />
                </div>
                <div>
                    <label htmlFor="reviewText">Review:</label>
                    <textarea 
                        id="reviewText"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        required 
                    />
                </div>
                <button type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </form>
        </div>
    );
}

const ItemDetails = ({ user }) => {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [commentsByReviewId, setCommentsByReviewId] = useState({}); 
  const [error, setError] = useState(null);

  const isLoggedIn = !!user;
  const userReview = isLoggedIn ? reviews.find(r => r.user_id === user.id) : null;

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setError(null);
        setCommentsByReviewId({}); // Clear comments on new item load
        const itemResponse = await fetchItemById(itemId);
        const reviewsResponse = await fetchReviewsForItem(itemId);

        if (itemResponse && itemResponse.data && itemResponse.data.item) {
            setItem(itemResponse.data.item);
        } else {
            throw new Error('Item not found or invalid data format.');
        }

        if (reviewsResponse && reviewsResponse.data && Array.isArray(reviewsResponse.data.reviews)) {
            setReviews(reviewsResponse.data.reviews);

        } else {
            console.error('Unexpected reviews response structure:', reviewsResponse);
            setReviews([]);
        }

      } catch (err) {
        console.error("Error fetching item details or reviews:", err);
        setError(err.message || 'Failed to load item details');
        setItem(null);
        setReviews([]);
        setCommentsByReviewId({});
      }
    };

    if (itemId) {
      loadDetails();
    }
  }, [itemId]);

  const handleReviewSubmitSuccess = (newReview) => {
      setReviews(prevReviews => {
          const existingIndex = prevReviews.findIndex(r => r.user_id === newReview.user_id);
          if (existingIndex > -1) {
              const updatedReviews = [...prevReviews];
              updatedReviews[existingIndex] = newReview;
              return updatedReviews;
          } else {
              return [newReview, ...prevReviews];
          }
      });
  };

  const handleDeleteReview = async (reviewId) => {
      if (!window.confirm("Are you sure you want to delete this review?")) return;
      try {
          await deleteReview(reviewId);
          // Remove the review from state
          setReviews(prevReviews => prevReviews.filter(r => r.id !== reviewId));

          setCommentsByReviewId(prev => {
              const newState = {...prev};
              delete newState[reviewId];
              return newState;
          });
      } catch (error) {
          console.error("Error deleting review:", error);
          alert("Failed to delete review."); // Simple error feedback
      }
  };

  const handleCommentSubmitSuccess = (reviewId, newComment) => {
      setCommentsByReviewId(prev => ({
          ...prev,
          [reviewId]: [...(prev[reviewId] || []), newComment] // Add new comment to existing list
      }));
  };

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  if (!item) {
    return <p>Loading item details...</p>;
  }

  return (
    <div>
      <h2>{item.name}</h2>
      <p>{item.description}</p>
      <p>Category: {item.category}</p>
      <p>Average Rating: {item.average_rating.toFixed(1)} ({item.review_count} reviews)</p>
      <hr />

      {/* Review Section */}
      <ReviewList 
          reviews={reviews} 
          user={user} 
          onDeleteReview={handleDeleteReview} 
          onCommentSubmitSuccess={handleCommentSubmitSuccess}
          commentsByReviewId={commentsByReviewId}
          setCommentsByReviewId={setCommentsByReviewId}
      />

      <hr />

      {/* Review Form Section */}
      {isLoggedIn ? (
          userReview ? (
              <div>
                  <h4>Your Review</h4>
                  <p>Rating: {userReview.rating}</p>
                  <p>{userReview.review_text}</p>
                  <p><em>(You can only submit one review per item. Edit feature coming soon!)</em></p>
              </div>
          ) : (
              <ReviewForm itemId={itemId} onSubmitSuccess={handleReviewSubmitSuccess} />
          )
      ) : (
          <p><Link to="/login">Log in</Link> or <Link to="/register">Register</Link> to write a review.</p>
      )}

      <hr />
      <Link to="/">Back to Home</Link>
    </div>
  );
};

export default ItemDetails; 