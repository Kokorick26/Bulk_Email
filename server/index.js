import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bulkEmailRoutes from './routes/bulk-email.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import inboxRoutes, { checkForNewEmails } from './routes/inbox.js';
import discoveryRoutes from './routes/discovery.js';
import trackingRoutes from './routes/tracking.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notification.js';
import { resetDailyUsage } from './services/emailRouter.js';
import { startCampaignScheduler, checkAllCampaignsForReplies } from './services/campaignExecutor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import http from 'http';
import { initSocket } from './services/socketService.js';

// ... (previous imports)

const app = express();
const server = http.createServer(app); // Create HTTP server
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
initSocket(server);

// ... (middleware)

// Start server
// Start server
server.listen(PORT, '0.0.0.0', () => { // Use server.listen instead of app.listen
    console.log(`🚀 Warmo Server running on port ${PORT}`);

    //  Start campaign scheduler (checks every 5 minutes)
    startCampaignScheduler(5);

    //  Start reply checker (checks every 5 minutes)
    setInterval(() => {
        checkAllCampaignsForReplies();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Run once immediately
    setTimeout(() => checkAllCampaignsForReplies(), 30000); // After 30 seconds

    //  Schedule daily cleanup at 2 AM
    const now = new Date();
    const tomorrow2AM = new Date(now);
    tomorrow2AM.setDate(tomorrow2AM.getDate() + 1);
    tomorrow2AM.setHours(2, 0, 0, 0);

    const msUntil2AM = tomorrow2AM.getTime() - now.getTime();

    setTimeout(() => {
        resetDailyUsage();
        // Then run every 24 hours
        setInterval(resetDailyUsage, 24 * 60 * 60 * 1000);
    }, msUntil2AM);

    console.log(' Campaign scheduler started');
    console.log(' Reply checker started (every 5 minutes)');
    console.log(` Daily cleanup scheduled for ${tomorrow2AM.toLocaleTimeString()}`);

    // ✅ Start background inbox poller (checks every 2 minutes)
    setInterval(() => {
        checkForNewEmails();
    }, 2 * 60 * 1000); // Every 2 minutes

    // Run inbox check after 45 seconds (after reply checker)
    setTimeout(() => checkForNewEmails(), 45000);

    console.log(' Inbox poller started (every 2 minutes)');
});

const requiredEnvVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`ERROR: Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

// FIX: Configure CORS properly (not allowing all origins)
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000', 'http://18.130.191.222:5000', 'https://warmo.ai', 'https://www.warmo.ai'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// FIX: Add request timeout
app.use((req, res, next) => {
    req.setTimeout(30000); // 30 seconds
    res.setTimeout(30000);
    next();
});

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bulk-email', bulkEmailRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

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



// FIX: Global error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit in production, just log
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // In production, you might want to restart the process
    // For now, just log and continue
});

