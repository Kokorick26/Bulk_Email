import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Save, Loader2, Type, User, Mail, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { useTheme } from '../../lib/ThemeContext';

const API_BASE = '/api/inbox';

interface SignatureManagerProps {
    accountId: string;
    accountName: string;
    accountEmail: string;
    onClose?: () => void;
}

export default function SignatureManager({
    accountId,
    accountName,
    accountEmail,
    onClose
}: SignatureManagerProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [signature, setSignature] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSignature();
    }, [accountId]);

    const fetchSignature = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch(`${API_BASE}/signature/${accountId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setSignature(data.signature || '');
            }
        } catch (err) {
            console.error('Failed to fetch signature:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const response = await fetch(`${API_BASE}/signature/${accountId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ signature })
            });

            if (response.ok) {
                toast.success('Signature saved');
                onClose?.();
            } else {
                throw new Error('Failed to save');
            }
        } catch (err) {
            toast.error('Failed to save signature');
        } finally {
            setSaving(false);
        }
    };

    const insertTemplate = (template: string) => {
        setSignature(prev => prev + template);
    };

    const templates = [
        {
            label: 'Professional',
            content: `
<div style="font-family: Arial, sans-serif; font-size: 12px; color: #333;">
    <p style="margin: 0;"><strong>${accountName}</strong></p>
    <p style="margin: 4px 0 0 0; color: #666;">${accountEmail}</p>
</div>
            `.trim()
        },
        {
            label: 'With Links',
            content: `
<div style="font-family: Arial, sans-serif; font-size: 12px; color: #333; margin-top: 16px; padding-top: 16px; border-top: 1px solid #ddd;">
    <p style="margin: 0;"><strong>${accountName}</strong></p>
    <p style="margin: 4px 0 0 0; color: #666;">${accountEmail}</p>
    <p style="margin: 4px 0 0 0;">
        <a href="#" style="color: #1a73e8; text-decoration: none;">LinkedIn</a> | 
        <a href="#" style="color: #1a73e8; text-decoration: none;">Website</a>
    </p>
</div>
            `.trim()
        },
        {
            label: 'Minimal',
            content: `<p style="font-size: 12px; color: #666;">— ${accountName}</p>`.trim()
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'rounded-lg border p-4',
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
            )}
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                        Email Signature
                    </h3>
                    <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-gray-500')}>
                        {accountEmail}
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                        'flex items-center gap-2',
                        isDark ? 'bg-blue-600 hover:bg-blue-700' : ''
                    )}
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Save
                </Button>
            </div>

            {/* Template Buttons */}
            <div className="flex gap-2 mb-4">
                {templates.map((template) => (
                    <button
                        key={template.label}
                        onClick={() => insertTemplate(template.content)}
                        className={cn(
                            'px-3 py-1.5 text-xs rounded-md border transition-colors',
                            isDark
                                ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        )}
                    >
                        {template.label}
                    </button>
                ))}
            </div>

            {/* Signature Editor */}
            <div className={cn(
                'relative rounded-lg border',
                isDark ? 'border-neutral-700' : 'border-gray-200'
            )}>
                <textarea
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Enter your signature HTML or text..."
                    rows={8}
                    className={cn(
                        'w-full p-3 rounded-lg resize-none outline-none text-sm font-mono',
                        isDark
                            ? 'bg-neutral-800 text-white placeholder:text-neutral-500'
                            : 'bg-gray-50 text-gray-900 placeholder:text-gray-400'
                    )}
                />
            </div>

            {/* Preview */}
            {signature && (
                <div className="mt-4">
                    <p className={cn(
                        'text-xs font-medium mb-2',
                        isDark ? 'text-neutral-400' : 'text-gray-500'
                    )}>
                        Preview
                    </p>
                    <div
                        className={cn(
                            'p-4 rounded-lg border',
                            isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                        )}
                        dangerouslySetInnerHTML={{ __html: signature }}
                    />
                </div>
            )}
        </motion.div>
    );
}
