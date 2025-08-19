const express = require('express');
const mysql = require('mysql2/promise'); // Use the promise-based version
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-super-secret-jwt-key'; // Change this to a long, random string!

// Middleware
app.use(express.json()); // Allows parsing of JSON data in requests
app.use(cors()); // Enable Cross-Origin Requests

// Create a MySQL connection pool (more efficient than single connection)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Your MySQL username
    password: 'your_mysql_password', // Your MySQL password
    database: 'my_website_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper function to generate JWT token
function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

// --- ROUTES ---

// 1. USER REGISTRATION
app.post('/api/register', async (req, res) => {
    const { first_name, last_name, email, password, phone_number } = req.body;

    try {
        // Check if user already exists
        const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(409).json({ message: 'Account already exists with this email.' }); // 409 Conflict
        }

        // Hash the password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user into the database
        const [result] = await pool.execute(
            'INSERT INTO users (first_name, last_name, email, password, phone_number) VALUES (?, ?, ?, ?, ?)',
            [first_name, last_name, email, hashedPassword, phone_number]
        );

        // Generate a token for the new user (optional: log them in immediately after registration)
        const token = generateToken(result.insertId);

        res.status(201).json({
            message: 'User created successfully!',
            token,
            userId: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
});

// 2. USER LOGIN
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by email
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' }); // 401 Unauthorized
        }

        const user = users[0];

        // Compare provided password with stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Password is correct! Generate a token
        const token = generateToken(user.id);

        res.json({
            message: 'Login successful!',
            token,
            userId: user.id,
            user: { first_name: user.first_name, last_name: user.last_name, email: user.email }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
});

// 3. SUBMIT A REVIEW (Protected Route - requires user to be logged in)
app.post('/api/reviews', async (req, res) => {
    // This expects a header like: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Gets the token part

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const { review_text, rating } = req.body;

        // Insert the review, linked to the user's ID
        await pool.execute(
            'INSERT INTO reviews (user_id, review_text, rating) VALUES (?, ?, ?)',
            [userId, review_text, rating]
        );

        res.status(201).json({ message: 'Review submitted successfully!' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            res.status(403).json({ message: 'Invalid or expired token.' }); // 403 Forbidden
        } else {
            console.error('Review submission error:', error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    }
});

// 4. GET ALL REVIEWS (Public Route)
app.get('/api/reviews', async (req, res) => {
    try {
        // Get reviews and join with users table to get user names
        const [reviews] = await pool.execute(`
            SELECT r.review_text, r.rating, r.created_at, u.first_name, u.last_name
            FROM reviews r
            INNER JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        `);
        res.json(reviews);
    } catch (error) {
        console.error('Fetch reviews error:', error);
        res.status(500).json({ message: 'Internal server error fetching reviews.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});