import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dynamoDB from '../db.js';
import auth from '../middleware/auth.js';
import { emitToUser } from '../services/socketService.js';

const router = express.Router();
const NOTIFICATIONS_TABLE = 'Notifications';

// ============ NOTIFICATIONS MANAGEMENT ============

// Get all notifications for user
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;

        // Use scan with filter since we don't have a proper GSI set up
        const data = await dynamoDB.scan({
            TableName: NOTIFICATIONS_TABLE,
            FilterExpression: 'userId = :userId',
            ExpressionAttributeValues: { ':userId': userId },
            Limit: limit * 2 // Get more since scan is less efficient
        }).promise();

        // Sort by createdAt descending and limit
        const notifications = (data.Items || [])
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);

        const unreadCount = notifications.filter(n => !n.read).length;

        res.json({ notifications, unreadCount });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        // If table doesn't exist or any error, return empty
        if (err.code === 'ResourceNotFoundException' || err.code === 'ValidationException') {
            return res.json({ notifications: [], unreadCount: 0 });
        }
        res.json({ notifications: [], unreadCount: 0 }); // Graceful fallback
    }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        const { id } = req.params;

        await dynamoDB.update({
            TableName: NOTIFICATIONS_TABLE,
            Key: { id },
            UpdateExpression: 'SET #read = :read',
            ExpressionAttributeNames: { '#read': 'read' },
            ExpressionAttributeValues: { ':read': true }
        }).promise();

        res.json({ success: true });
    } catch (err) {
        console.error('Error marking notification read:', err);
        res.json({ success: false });
    }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const data = await dynamoDB.scan({
            TableName: NOTIFICATIONS_TABLE,
            FilterExpression: 'userId = :userId AND #read = :unread',
            ExpressionAttributeNames: { '#read': 'read' },
            ExpressionAttributeValues: { ':userId': userId, ':unread': false }
        }).promise();

        const updates = (data.Items || []).map(item =>
            dynamoDB.update({
                TableName: NOTIFICATIONS_TABLE,
                Key: { id: item.id },
                UpdateExpression: 'SET #read = :read',
                ExpressionAttributeNames: { '#read': 'read' },
                ExpressionAttributeValues: { ':read': true }
            }).promise()
        );

        await Promise.all(updates);
        res.json({ success: true, count: updates.length });
    } catch (err) {
        console.error('Error marking all read:', err);
        res.json({ success: true, count: 0 });
    }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        await dynamoDB.delete({
            TableName: NOTIFICATIONS_TABLE,
            Key: { id }
        }).promise();

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting notification:', err);
        res.json({ success: false });
    }
});

// Clear all notifications
router.delete('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const data = await dynamoDB.scan({
            TableName: NOTIFICATIONS_TABLE,
            FilterExpression: 'userId = :userId',
            ExpressionAttributeValues: { ':userId': userId }
        }).promise();

        const deletes = (data.Items || []).map(item =>
            dynamoDB.delete({
                TableName: NOTIFICATIONS_TABLE,
                Key: { id: item.id }
            }).promise()
        );

        await Promise.all(deletes);
        res.json({ success: true, count: deletes.length });
    } catch (err) {
        console.error('Error clearing notifications:', err);
        res.json({ success: true, count: 0 });
    }
});

// ============ HELPER - Create Notification ============

export const createNotification = async (userId, notification) => {
    try {
        const item = {
            id: uuidv4(),
            userId,
            type: notification.type, // 'new_email', 'reply', 'campaign_complete', 'bounce'
            title: notification.title,
            message: notification.message,
            link: notification.link || null, // Where to navigate
            meta: notification.meta || {}, // Additional data
            read: false,
            createdAt: new Date().toISOString()
        };

        await dynamoDB.put({
            TableName: NOTIFICATIONS_TABLE,
            Item: item
        }).promise();

        // Emit real-time notification via WebSocket
        emitToUser(userId, 'NOTIFICATION', item);

        return item;
    } catch (err) {
        console.error('Error creating notification:', err);
        return null;
    }
};

export default router;
