import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dynamoDB from '../db.js';

const router = express.Router();
const USERS_TABLE = 'BulkEmailUsers';

// Default admin user (for initial setup)
const DEFAULT_ADMIN = {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
};

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check default admin first
        if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
            const token = jwt.sign(
                { userId: 'admin', email, role: 'admin' },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );
            return res.json({ token, user: { email, role: 'admin' } });
        }

        // Try to find user in database
        try {
            const result = await dynamoDB.scan({
                TableName: USERS_TABLE,
                FilterExpression: 'email = :email',
                ExpressionAttributeValues: { ':email': email }
            }).promise();

            if (result.Items && result.Items.length > 0) {
                const user = result.Items[0];
                const isMatch = await bcrypt.compare(password, user.password);

                if (isMatch) {
                    const token = jwt.sign(
                        { userId: user.id, email: user.email, role: user.role },
                        process.env.JWT_SECRET || 'your-secret-key',
                        { expiresIn: '24h' }
                    );
                    return res.json({ token, user: { email: user.email, role: user.role } });
                }
            }
        } catch (dbErr) {
            // Table might not exist, fall through to invalid credentials
            console.log('Database lookup failed, using default admin only');
        }

        res.status(401).json({ error: 'Invalid credentials' });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify token
router.get('/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ valid: false });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        res.json({ valid: true, user: decoded });
    } catch (err) {
        res.status(401).json({ valid: false });
    }
});

export default router;
