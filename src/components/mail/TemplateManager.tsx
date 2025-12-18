import { useState, useEffect } from 'react';
import {
    Plus, Edit3, Trash2, Copy, FileText, Save, X,
    Loader2, Sparkles, Variable
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ScrollArea } from '../ui/ScrollArea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogDescription
} from '../ui/Dialog';
import { EmptyState } from '../dashboard/EmptyState';

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    variables: string[];
    createdAt: string;
    updatedAt: string;
}

interface TemplateManagerProps {
    onSelectTemplate?: (template: EmailTemplate) => void;
    className?: string;
}

// Detect variables in template ({{variableName}})
const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    const variables = matches.map(m => m.replace(/\{\{|\}\}/g, ''));
    return [...new Set(variables)]; // Remove duplicates
};

// Local storage key
const STORAGE_KEY = 'email-templates';

const loadTemplates = (): EmailTemplate[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

const saveTemplates = (templates: EmailTemplate[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
};

export function TemplateManager({ onSelectTemplate, className }: TemplateManagerProps) {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [form, setForm] = useState({ name: '', subject: '', body: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setTemplates(loadTemplates());
    }, []);

    const handleOpenForm = (template?: EmailTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setForm({
                name: template.name,
                subject: template.subject,
                body: template.body,
            });
        } else {
            setEditingTemplate(null);
            setForm({ name: '', subject: '', body: '' });
        }
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingTemplate(null);
        setForm({ name: '', subject: '', body: '' });
    };

    const handleSave = () => {
        if (!form.name || !form.subject || !form.body) {
            toast.error('Please fill all fields');
            return;
        }

        setSaving(true);

        // Simulate save delay
        setTimeout(() => {
            const now = new Date().toISOString();
            const variables = [
                ...extractVariables(form.subject),
                ...extractVariables(form.body),
            ].filter((v, i, a) => a.indexOf(v) === i);

            let updatedTemplates: EmailTemplate[];

            if (editingTemplate) {
                updatedTemplates = templates.map(t =>
                    t.id === editingTemplate.id
                        ? { ...t, ...form, variables, updatedAt: now }
                        : t
                );
            } else {
                const newTemplate: EmailTemplate = {
                    id: `template-${Date.now()}`,
                    ...form,
                    variables,
                    createdAt: now,
                    updatedAt: now,
                };
                updatedTemplates = [...templates, newTemplate];
            }

            setTemplates(updatedTemplates);
            saveTemplates(updatedTemplates);
            handleCloseForm();
            toast.success(editingTemplate ? 'Template updated!' : 'Template created!');
            setSaving(false);
        }, 300);
    };

    const handleDelete = (id: string) => {
        if (!confirm('Delete this template?')) return;
        const updatedTemplates = templates.filter(t => t.id !== id);
        setTemplates(updatedTemplates);
        saveTemplates(updatedTemplates);
        toast.success('Template deleted');
    };

    const handleDuplicate = (template: EmailTemplate) => {
        const now = new Date().toISOString();
        const newTemplate: EmailTemplate = {
            ...template,
            id: `template-${Date.now()}`,
            name: `${template.name} (Copy)`,
            createdAt: now,
            updatedAt: now,
        };
        const updatedTemplates = [...templates, newTemplate];
        setTemplates(updatedTemplates);
        saveTemplates(updatedTemplates);
        toast.success('Template duplicated');
    };

    const detectedVariables = [
        ...extractVariables(form.subject),
        ...extractVariables(form.body),
    ].filter((v, i, a) => a.indexOf(v) === i);

    const insertVariable = (variable: string) => {
        setForm(prev => ({
            ...prev,
            body: prev.body + `{{${variable}}}`,
        }));
    };

    return (
        <div className={cn('space-y-6', className)}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Email Templates</h2>
                    <p className="text-white/40 mt-1">Create reusable templates with personalization</p>
                </div>
                <Button onClick={() => handleOpenForm()}>
                    <Plus className="w-4 h-4" />
                    New Template
                </Button>
            </div>

            {templates.length === 0 ? (
                <Card className="border-dashed">
                    <EmptyState
                        icon={<FileText className="w-8 h-8" />}
                        title="No Templates Yet"
                        description="Create your first template with personalization variables like {{name}}"
                        action={
                            <Button onClick={() => handleOpenForm()}>
                                <Plus className="w-4 h-4" />
                                Create Template
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                        <Card key={template.id} className="group hover:border-white/20 transition-colors">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg line-clamp-1">
                                        {template.name}
                                    </CardTitle>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleOpenForm(template)}
                                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDuplicate(template)}
                                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.id)}
                                            className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-xs text-white/40 mb-1">Subject</p>
                                    <p className="text-sm text-white line-clamp-1">{template.subject}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 mb-1">Preview</p>
                                    <p className="text-sm text-white/60 line-clamp-2">{template.body}</p>
                                </div>
                                {template.variables.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                        {template.variables.map((v) => (
                                            <Badge key={v} variant="outline" className="text-xs">
                                                <Variable className="w-3 h-3 mr-1" />
                                                {v}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                {onSelectTemplate && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full mt-2"
                                        onClick={() => onSelectTemplate(template)}
                                    >
                                        Use Template
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Template Form Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTemplate ? 'Edit Template' : 'Create Template'}
                        </DialogTitle>
                        <DialogDescription>
                            Use {"{{variableName}}"} syntax to add personalization fields
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm text-white/40 mb-1.5 block">Template Name</label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g., Welcome Email"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-white/40 mb-1.5 block">Subject Line</label>
                            <Input
                                value={form.subject}
                                onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))}
                                placeholder="e.g., Welcome to our platform, {{name}}!"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-sm text-white/40">Email Body</label>
                                <div className="flex gap-1">
                                    {['name', 'email', 'company'].map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => insertVariable(v)}
                                            className="text-xs px-2 py-1 rounded-md bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            +{v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                value={form.body}
                                onChange={(e) => setForm(p => ({ ...p, body: e.target.value }))}
                                placeholder={`Dear {{name}},\n\nThank you for joining us!\n\nBest regards,\nThe Team`}
                                rows={10}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none"
                            />
                        </div>

                        {detectedVariables.length > 0 && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm text-emerald-400">
                                    Variables detected: {detectedVariables.map(v => `{{${v}}}`).join(', ')}
                                </span>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseForm}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {editingTemplate ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
