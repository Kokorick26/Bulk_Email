import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bulkEmailRoutes from './routes/bulk-email.js';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bulk-email', bulkEmailRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Bulk Email Server running on port ${PORT}`);
});
