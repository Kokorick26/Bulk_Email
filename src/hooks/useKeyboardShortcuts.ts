import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
    onCompose?: () => void;
    onReply?: () => void;
    onReplyAll?: () => void;
    onForward?: () => void;
    onArchive?: () => void;
    onDelete?: () => void;
    onStar?: () => void;
    onMarkAsRead?: () => void;
    onGoToInbox?: () => void;
    onGoToSent?: () => void;
    onGoToDrafts?: () => void;
    onSearch?: () => void;
    onNextMessage?: () => void;
    onPrevMessage?: () => void;
    onEscape?: () => void;
    enabled?: boolean;
}

/**
 * Gmail-like keyboard shortcuts hook
 * 
 * Shortcuts:
 * - c: Compose new email
 * - r: Reply
 * - a: Reply All  
 * - f: Forward
 * - e: Archive
 * - #: Delete
 * - s: Star/Unstar
 * - Shift+i: Mark as read
 * - g then i: Go to Inbox
 * - g then s: Go to Sent
 * - g then d: Go to Drafts
 * - /: Focus search
 * - j: Next message
 * - k: Previous message
 * - Escape: Close/Cancel
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
    const {
        onCompose,
        onReply,
        onReplyAll,
        onForward,
        onArchive,
        onDelete,
        onStar,
        onMarkAsRead,
        onGoToInbox,
        onGoToSent,
        onGoToDrafts,
        onSearch,
        onNextMessage,
        onPrevMessage,
        onEscape,
        enabled = true,
    } = options;

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled) return;

        // Don't trigger shortcuts when typing in inputs
        const target = e.target as HTMLElement;
        const isTyping = target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable;

        if (isTyping && e.key !== 'Escape') return;

        // Handle 'g' prefix shortcuts (go to)
        if (e.key === 'g') {
            const handleGPrefix = (nextEvent: KeyboardEvent) => {
                nextEvent.preventDefault();
                switch (nextEvent.key) {
                    case 'i':
                        onGoToInbox?.();
                        break;
                    case 's':
                        onGoToSent?.();
                        break;
                    case 'd':
                        onGoToDrafts?.();
                        break;
                }
                document.removeEventListener('keydown', handleGPrefix);
            };

            // Wait for next key
            setTimeout(() => {
                document.addEventListener('keydown', handleGPrefix, { once: true });
                // Remove after 1 second if nothing pressed
                setTimeout(() => {
                    document.removeEventListener('keydown', handleGPrefix);
                }, 1000);
            }, 0);
            return;
        }

        switch (e.key.toLowerCase()) {
            case 'c':
                e.preventDefault();
                onCompose?.();
                break;
            case 'r':
                e.preventDefault();
                onReply?.();
                break;
            case 'a':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    onReplyAll?.();
                }
                break;
            case 'f':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    onForward?.();
                }
                break;
            case 'e':
                e.preventDefault();
                onArchive?.();
                break;
            case '#':
                e.preventDefault();
                onDelete?.();
                break;
            case 's':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    onStar?.();
                }
                break;
            case 'i':
                if (e.shiftKey) {
                    e.preventDefault();
                    onMarkAsRead?.();
                }
                break;
            case '/':
                e.preventDefault();
                onSearch?.();
                break;
            case 'j':
                e.preventDefault();
                onNextMessage?.();
                break;
            case 'k':
                e.preventDefault();
                onPrevMessage?.();
                break;
            case 'escape':
                onEscape?.();
                break;
        }
    }, [
        enabled,
        onCompose,
        onReply,
        onReplyAll,
        onForward,
        onArchive,
        onDelete,
        onStar,
        onMarkAsRead,
        onGoToInbox,
        onGoToSent,
        onGoToDrafts,
        onSearch,
        onNextMessage,
        onPrevMessage,
        onEscape,
    ]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

export default useKeyboardShortcuts;
