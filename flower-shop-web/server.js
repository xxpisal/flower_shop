const express = require('express');
const { Pool } = require('pg');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'flowerdb',
  user: process.env.DB_USER || 'floweruser',
  password: process.env.DB_PASSWORD || 'flowerpass',
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  store: new pgSession({ pool, tableName: 'user_sessions' }),
  secret: process.env.SESSION_SECRET || 'flower-shop-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Wait for DB to be ready
async function waitForDB(retries = 15, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ Connected to PostgreSQL');
      return;
    } catch (err) {
      console.log(`⏳ Waiting for database... (${i + 1}/${retries})`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error('❌ Could not connect to database');
  process.exit(1);
}

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.status(401).json({ error: 'Please log in' });
}

// ========== AUTH ROUTES ==========

// Sign up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    const user = result.rows[0];
    req.session.userId = user.id;
    req.session.userName = user.name;
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user.id;
    req.session.userName = user.name;
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({ id: req.session.userId, name: req.session.userName });
  }
  res.status(401).json({ error: 'Not logged in' });
});

// ========== FLOWER ROUTES ==========

// Get all flowers
app.get('/api/flowers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM flowers ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching flowers:', err.message);
    res.status(500).json({ error: 'Failed to fetch flowers' });
  }
});

// Get single flower
app.get('/api/flowers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM flowers WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flower not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching flower:', err.message);
    res.status(500).json({ error: 'Failed to fetch flower' });
  }
});

// ========== ORDER ROUTES (require auth) ==========

// Create an order
app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const { flower_id, quantity } = req.body;
    if (!flower_id || !quantity) {
      return res.status(400).json({ error: 'Flower and quantity are required' });
    }

    const flower = await pool.query('SELECT * FROM flowers WHERE id = $1', [flower_id]);
    if (flower.rows.length === 0) {
      return res.status(404).json({ error: 'Flower not found' });
    }

    const total_price = flower.rows[0].price * quantity;
    const result = await pool.query(
      `INSERT INTO orders (user_id, flower_id, quantity, total_price)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.session.userId, flower_id, quantity, total_price]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating order:', err.message);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user orders
app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, f.name as flower_name, f.image_url
      FROM orders o
      JOIN flowers f ON o.flower_id = f.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [req.session.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// Start server
waitForDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🌸 Flower Shop running at http://localhost:${PORT}`);
  });
});
