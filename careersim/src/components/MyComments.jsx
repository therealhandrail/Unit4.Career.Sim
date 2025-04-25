import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyComments, deleteComment } from '../api'; // Adjust path as needed

// TODO: Add Edit functionality

const MyComments = ({ user }) => {
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        setError('You must be logged in to view your comments.');
        return;
    }
    const getMyComments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchMyComments();
        if (response && response.data && Array.isArray(response.data.comments)) {
            setComments(response.data.comments);
        } else {
            console.error('Unexpected API response:', response);
            setError('Failed to fetch comments: Invalid data format.');
            setComments([]);
        }
      } catch (err) {
        console.error("Error fetching my comments:", err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch comments');
        setComments([]);
      } finally {
          setLoading(false);
      }
    };

    getMyComments();
  }, [user]);

  const handleDeleteComment = async (commentId) => {
      if (!window.confirm("Are you sure you want to delete this comment?")) return;
      try {
          await deleteComment(commentId);
          setComments(prevComments => prevComments.filter(c => c.id !== commentId));
      } catch (error) {
          console.error("Error deleting comment:", error);
          alert("Failed to delete comment.");
      }
  };

  if (loading) {
      return <p>Loading your comments...</p>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div>
      <h2>My Comments</h2>
      {comments.length === 0 ? (
        <p>You haven't written any comments yet.</p>
      ) : (
        <ul>
          {comments.map((comment) => (
            <li key={comment.id} style={{marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
              <p>Comment on review for: <Link to={`/items/${comment.item_id}`}>{comment.item_name || `Item #${comment.item_id}`}</Link></p>
              <p>{comment.comment_text}</p>
              <p><small><em>Commented on: {new Date(comment.created_at).toLocaleDateString()}</em></small></p>
              <button onClick={() => handleDeleteComment(comment.id)} style={{marginRight: '5px'}}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyComments; 