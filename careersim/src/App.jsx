import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import './App.css'
import { fetchMe, setAuthToken } from './api'
import Home from './components/Home'
import ItemDetails from './components/ItemDetails'
import Login from './components/Login'
import Register from './components/Register'
import MyReviews from './components/MyReviews'
import MyComments from './components/MyComments'

const NotFound = () => <h2>404 Not Found</h2>

const Navigation = ({ user, setToken, setUser }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    setAuthToken(null)
    setToken(null)
    setUser(null)
    navigate('/')
  }

  return (
    <nav>
      <Link to="/">Home</Link> | 
      {user ? (
        <>
          <span>Welcome, {user.username}!</span> | 
          <Link to="/reviews/me">My Reviews</Link> | 
          <Link to="/comments/me">My Comments</Link> | 
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link> | 
          <Link to="/register">Register</Link> 
        </>
      )}
    </nav>
  )
}

function App() {
  const [token, setTokenState] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  const setToken = (newToken) => {
    setTokenState(newToken)
    setAuthToken(newToken)
  }

  useEffect(() => {
    const getUserData = async () => {
      if (token) {
        try {
          setAuthToken(token)
          const response = await fetchMe()
          if (response && response.data) {
            setUser(response.data)
          } else {
            setToken(null)
            setUser(null)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setToken(null)
          setUser(null)
        }
      } else {
        setUser(null)
      }
    }

    getUserData()
  }, [token])

  return (
    <div className="App">
      <h1>Review Site</h1>
      <Navigation user={user} setToken={setToken} setUser={setUser} /> 
      <hr />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/items/:itemId" element={<ItemDetails user={user} />} /> 
        <Route path="/login" element={<Login setToken={setToken} setUser={setUser} />} />
        <Route path="/register" element={<Register setToken={setToken} setUser={setUser} />} />
        <Route 
          path="/reviews/me" 
          element={user ? <MyReviews user={user} /> : <Navigate to="/login" replace />}
        />
        <Route 
          path="/comments/me" 
          element={user ? <MyComments user={user} /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
