import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, setAuthToken, fetchMe } from '../api'; // Adjust path as needed

// TODO: Pass setToken and setUser functions down from App.jsx as props
const Register = ({ setToken, setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!username || !password || !confirmPassword) {
        setError('All fields are required.');
        return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    // Add password complexity check if desired (e.g., length)
    if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
    }

    try {
      const response = await registerUser({ username, password });
      console.log('Register Response:', response);

      if (response && response.data && response.data.token) {
         const receivedToken = response.data.token;
        
        // Use the functions passed from App.jsx
        setToken(receivedToken);
        setAuthToken(receivedToken);

        // Optionally fetch user details immediately after registration
        const userResponse = await fetchMe();
        if (userResponse && userResponse.data) {
            setUser(userResponse.data);
        }

        // Redirect after successful registration
        navigate('/'); // Redirect to home or dashboard
      } else {
        throw new Error(response.data.message || 'Registration failed: No token received.');
      }
    } catch (err) {
      console.error("Registration Error:", err);
      const errMsg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errMsg);
      setAuthToken(null); // Clear token on failure
      setUser(null);
    }
  };

  return (
    <div>
      <h2>Register</h2>
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
        <div>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default Register; 