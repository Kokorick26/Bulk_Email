import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bulkEmailRoutes from './routes/bulk-email.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import inboxRoutes from './routes/inbox.js';
import discoveryRoutes from './routes/discovery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bulk-email', bulkEmailRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/discovery', discoveryRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    // Handle SPA routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Bulk Email Server running on port ${PORT}`);
});
