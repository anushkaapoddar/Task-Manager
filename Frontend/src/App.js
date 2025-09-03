import React, { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      // ✅ Verify token is valid before setting user
      try {
        setUser(JSON.parse(savedUser));
        fetchTasks();
      } catch (error) {
        // Token is invalid, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // ✅ If token is invalid, clear everything
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data.message || 'Failed to fetch tasks');
      }
      
      // ✅ FIX: Ensure tasks is always an array
      setTasks(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error('Fetch tasks error:', error);
      setError(error.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const register = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      alert('Registration successful! Please login.');
      setAuthMode('login');
      setName('');
      setEmail('');
      setPassword('');
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      // ✅ Save token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      await fetchTasks();
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTask })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add task');
      }
      
      setTasks([...tasks, data]);
      setNewTask('');
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (id) => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const task = tasks.find(t => t._id === id);
      const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: task.status === 'completed' ? 'pending' : 'completed' })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update task');
      }
      
      setTasks(tasks.map(t => t._id === id ? data : t));
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete task');
      }
      
      setTasks(tasks.filter(t => t._id !== id));
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Safe rendering of tasks
  const renderTasks = () => {
    if (!Array.isArray(tasks)) {
      return <p>No tasks found</p>;
    }
    
    return tasks.map(task => (
      <div key={task._id} style={{
        padding: '15px',
        margin: '10px 0',
        border: '1px solid #ddd',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: task.status === 'completed' ? '#f0fff0' : '#fff'
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            textDecoration: task.status === 'completed' ? 'line-through' : 'none', 
            margin: '0 0 5px 0',
            color: task.status === 'completed' ? '#666' : '#000'
          }}>
            {task.title}
          </h3>
          {task.description && <p style={{ margin: 0, color: '#666' }}>{task.description}</p>}
        </div>
        <div>
          <button onClick={() => toggleTask(task._id)} 
                  disabled={loading}
                  style={{ margin: '0 5px', padding: '8px 12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}>
            {task.status === 'completed' ? 'Undo' : '✓'}
          </button>
          <button onClick={() => deleteTask(task._id)} 
                  disabled={loading}
                  style={{ margin: '0 5px', padding: '8px 12px', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px' }}>
            ✕
          </button>
        </div>
      </div>
    ));
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', fontFamily: 'Arial' }}>
        <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
        
        {error && (
          <div style={{ color: 'red', padding: '10px', margin: '10px 0', border: '1px solid red', borderRadius: '5px' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={authMode === 'login' ? login : register}>
          {authMode === 'register' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              required
              disabled={loading}
              style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            disabled={loading}
            style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            disabled={loading}
            style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: '10px', width: '100%', margin: '10px 0' }}
          >
            {loading ? 'Processing...' : (authMode === 'login' ? 'Login' : 'Register')}
          </button>
        </form>
        <button 
          onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} 
          disabled={loading}
          style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
        >
          {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Welcome, {user.name}!</h1>
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setTasks([]);
          }} 
          disabled={loading}
          style={{ padding: '10px' }}
        >
          Logout
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', padding: '10px', margin: '10px 0', border: '1px solid red', borderRadius: '5px' }}>
          {error}
        </div>
      )}

      <div style={{ margin: '20px 0' }}>
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add new task..."
          disabled={loading}
          style={{ padding: '10px', width: '70%', marginRight: '10px' }}
        />
        <button 
          onClick={addTask} 
          disabled={loading}
          style={{ padding: '10px' }}
        >
          {loading ? 'Adding...' : 'Add Task'}
        </button>
      </div>

      <div>
        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p>No tasks yet. Add your first task above!</p>
        ) : (
          renderTasks()
        )}
      </div>
    </div>
  );
}

export default App;