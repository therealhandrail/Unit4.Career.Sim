import axios from 'axios';

// Determine the base URL for the API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('Using API URL:', API_URL);

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Function to set the auth token for subsequent requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// --- Auth API Calls ---
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const fetchMe = () => api.get('/auth/me');

// --- Item API Calls ---
export const fetchAllItems = () => api.get('/items');
export const fetchItemById = (itemId) => api.get(`/items/${itemId}`);

// --- Review API Calls ---
export const fetchReviewsForItem = (itemId) => api.get(`/items/${itemId}/reviews`);
export const postReview = (itemId, reviewData) => api.post(`/items/${itemId}/reviews`, reviewData);
export const fetchMyReviews = () => api.get('/reviews/me');
export const updateReview = (reviewId, reviewData) => api.put(`/reviews/${reviewId}`, reviewData);
export const deleteReview = (reviewId) => api.delete(`/reviews/${reviewId}`);

// --- Comment API Calls ---
export const fetchCommentsForReview = (reviewId) => api.get(`/reviews/${reviewId}/comments`);
export const postComment = (reviewId, commentData) => api.post(`/reviews/${reviewId}/comments`, commentData);
export const fetchMyComments = () => api.get('/comments/me');
export const updateComment = (commentId, commentData) => api.put(`/comments/${commentId}`, commentData);
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`);

// Check for existing token on load
const initialToken = localStorage.getItem('token');
if (initialToken) {
  setAuthToken(initialToken);
}

export default api; // Export the configured instance 