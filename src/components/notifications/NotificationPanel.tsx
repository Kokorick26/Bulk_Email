import { useState, useEffect, useCallback } from 'react';
import {
    Bell, X, Check, Mail, MessageCircle, CheckCircle, AlertTriangle,
    Trash2, ChevronRight, Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { useDashboardContext } from '../../layouts/DashboardShell';
import { ScrollArea } from '../ui/ScrollArea';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    type: 'new_email' | 'reply' | 'campaign_complete' | 'bounce';
    title: string;
    message: string;
    link?: string;
    meta?: Record<string, any>;
    read: boolean;
    createdAt: string;
}

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'new_email': return Mail;
        case 'reply': return MessageCircle;
        case 'campaign_complete': return CheckCircle;
        case 'bounce': return AlertTriangle;
        default: return Bell;
    }
};

const getNotificationColor = (type: string) => {
    switch (type) {
        case 'new_email': return 'text-blue-400';
        case 'reply': return 'text-green-400';
        case 'campaign_complete': return 'text-emerald-400';
        case 'bounce': return 'text-red-400';
        default: return 'text-gray-400';
    }
};

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
    const { theme } = useTheme();
    const { socket, setActiveSection, setActiveSubItem } = useDashboardContext();
    const isDark = theme === 'dark';

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch('/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    // Listen for real-time notifications
    useEffect(() => {
        if (!socket) return;

        const handleNotification = (notification: Notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        };

        socket.on('NOTIFICATION', handleNotification);
        return () => {
            socket.off('NOTIFICATION', handleNotification);
        };
    }, [socket]);

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch('/api/notifications/read-all', {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const token = localStorage.getItem('bulkEmailToken');
            await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const notification = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notification && !notification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }

        // Navigate based on notification type
        if (notification.type === 'new_email' || notification.type === 'reply') {
            setActiveSection('inbox');
            setActiveSubItem('all-mail');
        } else if (notification.type === 'campaign_complete') {
            setActiveSection('campaigns');
        }

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={cn(
            'absolute right-0 top-full mt-2 w-96 rounded-xl border shadow-2xl z-50',
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
        )}>
            {/* Header */}
            <div className={cn(
                'flex items-center justify-between px-4 py-3 border-b',
                isDark ? 'border-neutral-800' : 'border-gray-200'
            )}>
                <div className="flex items-center gap-2">
                    <Bell className={cn('w-4 h-4', isDark ? 'text-white' : 'text-gray-900')} />
                    <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                        Notifications
                    </span>
                    {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-orange-500 text-white">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className={cn(
                                'p-1.5 rounded-lg text-[11px] font-medium transition-colors',
                                isDark ? 'text-blue-400 hover:bg-neutral-800' : 'text-blue-600 hover:bg-gray-100'
                            )}
                        >
                            Mark all read
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-gray-400 hover:bg-gray-100'
                        )}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="max-h-96">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className={cn('w-5 h-5 border-2 rounded-full animate-spin border-t-transparent',
                            isDark ? 'border-orange-500' : 'border-blue-500'
                        )} />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Bell className={cn('w-10 h-10 mb-3', isDark ? 'text-neutral-700' : 'text-gray-300')} />
                        <p className={cn('text-sm', isDark ? 'text-neutral-500' : 'text-gray-500')}>
                            No notifications yet
                        </p>
                    </div>
                ) : (
                    <div className="py-1">
                        {notifications.map((notification) => {
                            const Icon = getNotificationIcon(notification.type);
                            const iconColor = getNotificationColor(notification.type);

                            return (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                                        !notification.read && (isDark ? 'bg-blue-500/5' : 'bg-blue-50/50'),
                                        isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-50'
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                        isDark ? 'bg-neutral-800' : 'bg-gray-100'
                                    )}>
                                        <Icon className={cn('w-4 h-4', iconColor)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={cn(
                                                'text-[13px] font-medium truncate',
                                                isDark ? 'text-white' : 'text-gray-900'
                                            )}>
                                                {notification.title}
                                            </p>
                                            {!notification.read && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                            )}
                                        </div>
                                        <p className={cn(
                                            'text-[12px] mt-0.5 line-clamp-2',
                                            isDark ? 'text-neutral-400' : 'text-gray-500'
                                        )}>
                                            {notification.message}
                                        </p>
                                        <p className={cn(
                                            'text-[10px] mt-1 flex items-center gap-1',
                                            isDark ? 'text-neutral-500' : 'text-gray-400'
                                        )}>
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notification.id);
                                        }}
                                        className={cn(
                                            'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                                            isDark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-200 text-gray-400'
                                        )}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className={cn(
                    'px-4 py-2 border-t',
                    isDark ? 'border-neutral-800' : 'border-gray-200'
                )}>
                    <button
                        onClick={() => {
                            setActiveSection('settings');
                            setActiveSubItem('notifications');
                            onClose();
                        }}
                        className={cn(
                            'w-full flex items-center justify-center gap-1 text-[12px] font-medium py-1.5 rounded-lg transition-colors',
                            isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        )}
                    >
                        View all notifications
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}

export default NotificationPanel;
