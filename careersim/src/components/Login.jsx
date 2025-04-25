import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, setAuthToken, fetchMe } from '../api'; // Adjust path as needed

// TODO: Pass setToken and setUser functions down from App.jsx as props
const Login = ({ setToken, setUser }) => { 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null); // Clear previous errors

    if (!username || !password) {
        setError('Username and password are required.');
        return;
    }

    try {
      const response = await loginUser({ username, password });
      console.log('Login Response:', response);

      if (response && response.data && response.data.token) {
        const receivedToken = response.data.token;
        
        // Use the functions passed from App.jsx
        setToken(receivedToken); // Update token state in App
        setAuthToken(receivedToken); // Set token for future API calls and save to localStorage

        // Optionally fetch user details immediately after login
        const userResponse = await fetchMe();
        if (userResponse && userResponse.data) {
            setUser(userResponse.data); // Update user state in App
        }

        // Redirect to home page or dashboard after successful login
        navigate('/'); 
      } else {
        throw new Error(response.data.message || 'Login failed: No token received.');
      }
    } catch (err) {
      console.error("Login Error:", err);
      // Use error message from backend if available
      const errMsg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      setAuthToken(null); // Clear token on failure
      setUser(null);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Log In</button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default Login; 