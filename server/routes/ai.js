import express from 'express';
import auth from '../middleware/auth.js';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const router = express.Router();

// Mistral AI API endpoint
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// Tool definitions for AI function calling
const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'preview_single_email',
            description: 'Preview an email for ONE specific person. Use when user says "send to [name]" - show preview first, do not send.',
            parameters: {
                type: 'object',
                properties: {
                    recipientName: {
                        type: 'string',
                        description: 'The name of the recipient'
                    },
                    subject: {
                        type: 'string',
                        description: 'The email subject line'
                    },
                    body: {
                        type: 'string',
                        description: 'The email body'
                    }
                },
                required: ['recipientName', 'subject', 'body']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'preview_bulk_campaign',
            description: 'Preview a bulk email campaign showing sample personalized emails. Use when user says "send to all" - show preview first.',
            parameters: {
                type: 'object',
                properties: {
                    subject: {
                        type: 'string',
                        description: 'The email subject template with {{name}}, {{company}} placeholders'
                    },
                    body: {
                        type: 'string',
                        description: 'The email body template with {{name}}, {{company}} placeholders'
                    }
                },
                required: ['subject', 'body']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'personalize_all_emails',
            description: 'Generate unique email content for EACH recipient. USE THIS whenever user asks to write, draft, or create emails for a campaign. This is the PRIMARY tool for email creation - it generates distinct content per recipient so each email is different.',
            parameters: {
                type: 'object',
                properties: {
                    baseSubject: {
                        type: 'string',
                        description: 'The subject line theme (will be varied for each recipient)'
                    },
                    baseBody: {
                        type: 'string',
                        description: 'The email body content/message (will be rewritten uniquely for each recipient)'
                    },
                    personalizationStyle: {
                        type: 'string',
                        enum: ['medium', 'heavy'],
                        description: 'How much to vary: medium (same message, different wording), heavy (fully unique per person). Default to medium.'
                    }
                },
                required: ['baseSubject', 'baseBody']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'send_test_email',
            description: 'Send a test email to verify the email content before sending to all recipients',
            parameters: {
                type: 'object',
                properties: {
                    subject: {
                        type: 'string',
                        description: 'The email subject line'
                    },
                    body: {
                        type: 'string',
                        description: 'The email body content'
                    },
                    testEmail: {
                        type: 'string',
                        description: 'The email address to send the test to'
                    }
                },
                required: ['subject', 'body', 'testEmail']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_campaign_stats',
            description: 'Get statistics about email campaigns including sent, opened, clicked counts',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'insert_email_content',
            description: 'Insert the generated subject and body into the compose form for the user to review before sending',
            parameters: {
                type: 'object',
                properties: {
                    subject: {
                        type: 'string',
                        description: 'The email subject line'
                    },
                    body: {
                        type: 'string',
                        description: 'The email body content'
                    }
                },
                required: ['subject', 'body']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'update_email_content',
            description: 'Update or modify the current email subject or body. Use when user asks to change, edit, or modify the email content.',
            parameters: {
                type: 'object',
                properties: {
                    newSubject: {
                        type: 'string',
                        description: 'The new/updated email subject line. Leave empty to keep current subject.'
                    },
                    newBody: {
                        type: 'string',
                        description: 'The new/updated email body content. Leave empty to keep current body.'
                    },
                    modification: {
                        type: 'string',
                        description: 'Description of what was changed (e.g., "Made the email shorter", "Added personalization")'
                    }
                },
                required: ['modification']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'edit_selected_text',
            description: 'Edit a specific selected section of text from an email. Use when user selects text and asks to modify just that part.',
            parameters: {
                type: 'object',
                properties: {
                    selectedText: {
                        type: 'string',
                        description: 'The original selected text that needs to be edited'
                    },
                    editedText: {
                        type: 'string',
                        description: 'The new/edited version of the selected text'
                    },
                    recipientEmail: {
                        type: 'string',
                        description: 'The email address of the recipient whose email is being edited (optional, for specific recipient edits)'
                    },
                    editDescription: {
                        type: 'string',
                        description: 'Brief description of what was changed'
                    }
                },
                required: ['selectedText', 'editedText', 'editDescription']
            }
        }
    }
];

// System prompt for the email assistant with tool awareness
const SYSTEM_PROMPT = `You are Iris, a world-class copywriter for Kokorick AI.
Your goal is to write emails that are indistinguishable from a real human sending a personal note.

## THE "HUMAN" STYLE GUIDE (STRICTLY FOLLOW)
1. **Subject Lines**: loose, casual, often lowercase. max 4-6 words. (e.g. "quick question", "thoughts on this?", "intro"). NEVER use "Title Case Marketing Speak".
2. **Opening**: NO "I hope this email finds you well". Start directly. "Hey {{name}}, saw your post about..." or "Hi {{name}},"
3. **Body**: Write naturally and thoughtfully. Explain the value proposition clearly and politely. It should feel like a genuine, well-crafted personal email.
4. **Tone**: Professional, authentic, and respectful. Avoid being too casual or too formal.
5. **Completeness**: Ensure the email has a proper structure: Context -> Value/Reason -> Call to Action.
6. **Punctuation**: STRICTLY NO em dashes or en dashes. NEVER use the character "—" or "–". Always use regular hyphens "-" or colons ":" instead.

## HANDLING REQUESTS
- "send to [name]" → preview_single_email
- "send to all" → preview_bulk_campaign  
- "write email" or "draft email" → ALWAYS use personalize_all_emails to generate unique emails for each recipient
- "change/edit" → update_email_content

## IMPORTANT: When asked to write/draft/create an email for a campaign with multiple recipients, ALWAYS use personalize_all_emails tool to generate unique content for EACH recipient. Never just insert a template - always generate individual emails.

## RULES
- Always show preview first before sending.
- Use {{name}}, {{company}} for personalization placeholders.
- Never mention you are an AI.
- CRITICAL: NEVER use em dashes (—) or en dashes (–). Only use regular hyphens (-) or colons (:).
- **NO PLACEHOLDERS**: Never use [Your Name], [Company Name], or [Insert Here].
- **NO CURLY BRACES** on regular words - only use {{name}} and {{company}} for personalization.
- **IDENTITY**: Unless told otherwise, sign off as "Bhawesh" (CTO) and assume the company is "Kokorick AI".
- **READY TO SEND**: The output must be completely ready to send. No editing required.`;




// Enhanced personalization with content variation
const personalizeContent = (template, recipient, emailIndex = 0) => {
    let result = template;
    
    // Replace variables
    Object.entries(recipient).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        result = result.replace(regex, value || '');
    });
    
    // Add subtle variations to avoid tracking
    result = addContentVariation(result, emailIndex);
    
    return result;
};

// Advanced content variation to prevent email provider tracking
const addContentVariation = (content, seed = 0) => {
    if (!content) return content;
    
    let result = content;
    
    // 1. Random spacing variations
    const spacingVariations = [
        /\s+/g,
        /\s*([,.!?])\s*/g
    ];
    
    // Add subtle spacing variations based on seed
    if (seed % 3 === 0) {
        result = result.replace(/\s+/g, (match) => {
            const variations = [' ', '  ', ' '];
            return variations[seed % variations.length];
        });
    }
    
    // 2. Punctuation variations (very subtle)
    if (seed % 5 === 0) {
        result = result.replace(/\./g, (match, offset) => {
            // Only change some periods to maintain readability
            return offset % 7 === 0 ? '.' : '.';
        });
    }
    
    // 3. Word choice variations
    const wordVariations = {
        'quick': ['quick', 'fast', 'swift'],
        'hello': ['hello', 'hi', 'hey'],
        'thank': ['thank', 'thanks', 'appreciate'],
        'best': ['best', 'regards', 'sincerely'],
        'sincerely': ['sincerely', 'best regards', 'warmly'],
        'opportunity': ['opportunity', 'chance', 'possibility'],
        'interested': ['interested', 'curious', 'intrigued'],
        'contact': ['contact', 'reach out', 'connect'],
        'help': ['help', 'assist', 'support'],
        'great': ['great', 'excellent', 'wonderful']
    };
    
    // Apply word variations based on seed
    Object.entries(wordVariations).forEach(([word, alternatives]) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (result.match(regex)) {
            const altIndex = (seed + word.length) % alternatives.length;
            result = result.replace(regex, alternatives[altIndex]);
        }
    });
    
    // 4. Sentence structure variations
    if (seed % 4 === 0) {
        // Occasionally combine short sentences
        result = result.replace(/([.!?]\s+)([A-Z])/g, (match, punct, nextChar) => {
            return seed % 7 === 0 ? ', ' + nextChar.toLowerCase() : match;
        });
    }
    
    // 5. HTML attribute variations (for HTML emails)
    if (result.includes('<')) {
        // Add random attributes or styling
        const htmlVariations = [
            () => seed % 3 === 0 ? ' style="font-size:16px;"' : '',
            () => seed % 4 === 0 ? ' class="em-text"' : '',
            () => seed % 5 === 0 ? ' data-email-id="em' + seed + '"' : ''
        ];
        
        result = result.replace(/<p>/g, (match) => {
            const variation = htmlVariations.find(v => v());
            return variation ? match.replace('>', variation + '>') : match;
        });
    }
    
    // 6. Time-based variations
    const timeBasedVar = getTimeBasedVariation();
    result = result.replace(/\[time_greeting\]/g, timeBasedVar);
    
    return result;
};

// Get time-based greeting variations
const getTimeBasedVariation = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
        const morningGreetings = ['Good morning', 'Hope you\'re having a great morning', 'Morning'];
        return morningGreetings[Math.floor(Math.random() * morningGreetings.length)];
    } else if (hour < 17) {
        const afternoonGreetings = ['Good afternoon', 'Hope your day is going well', 'Afternoon'];
        return afternoonGreetings[Math.floor(Math.random() * afternoonGreetings.length)];
    } else {
        const eveningGreetings = ['Good evening', 'Hope you\'re having a good evening', 'Evening'];
        return eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)];
    }
};

// Context management system
let emailContext = new Map();

const updateEmailContext = (campaignId, context) => {
    emailContext.set(campaignId, {
        ...context,
        lastUpdated: new Date().toISOString()
    });
};

const getEmailContext = (campaignId) => {
    return emailContext.get(campaignId) || {};
};

// Helper function to remove em dashes, markdown, and other problematic characters
const sanitizeContent = (content) => {
    if (!content) return content;
    return content
        .replace(/—/g, '-')  // em dash to hyphen
        .replace(/–/g, '-')  // en dash to hyphen
        .replace(/"/g, '"')  // smart quotes
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/'/g, "'")
        .replace(/\*\*/g, '')  // remove bold markdown
        .replace(/\*/g, '')    // remove italic markdown
        .replace(/^#+\s*/gm, ''); // remove heading markdown
};

// Generate truly unique personalized email for each recipient using AI
const generateUniqueEmail = async (baseSubject, baseBody, recipient, index, style, headers) => {
    const apiKey = process.env.MISTRAL_API_KEY;
    
    // For light personalization, just do variable replacement with variations
    if (style === 'light' || !apiKey) {
        let subject = baseSubject;
        let body = baseBody;
        
        // Replace variables
        Object.entries(recipient).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
            subject = subject.replace(regex, value || '');
            body = body.replace(regex, value || '');
        });
        
        // Add subtle variations
        body = addContentVariation(body, index);
        
        return { subject: sanitizeContent(subject), body: sanitizeContent(body) };
    }
    
    // For medium/heavy personalization, use AI to generate unique content
    const recipientInfo = Object.entries(recipient)
        .map(([k, v]) => `${k}: "${v}"`)
        .join(', ');
    
    const personalizationPrompt = style === 'heavy' 
        ? `Write a completely unique email for this specific person. Make it feel like you researched them personally.`
        : `Personalize this email template for this specific recipient. Keep the core message but adapt the tone and details.`;
    
    try {
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: [
                    { 
                        role: 'system', 
                        content: `You are an expert email copywriter. ${personalizationPrompt}
                        
CRITICAL RULES:
- NEVER use em dashes (—) or en dashes (–). Only use regular hyphens (-) or colons (:).
- NEVER use markdown formatting like **bold** or *italic* in the output. Plain text only.
- Output ONLY the email content, no explanations.
- Format: First line is subject (no "Subject:" prefix, no asterisks), then blank line, then body.
- Keep it concise and human-sounding.
- Do not use [brackets] for placeholders.`
                    },
                    { 
                        role: 'user', 
                        content: `Recipient info: ${recipientInfo}

Base subject: ${baseSubject}
Base body: ${baseBody}

Generate a personalized version for this recipient. Remember: NO em dashes, NO en dashes.`
                    }
                ],
                temperature: 0.8 + (index * 0.01), // Slight variation per recipient
                max_tokens: 512
            })
        });

        if (!response.ok) {
            // Fallback to simple personalization
            return generateUniqueEmail(baseSubject, baseBody, recipient, index, 'light', headers);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        // Parse subject and body from response
        const lines = content.trim().split('\n');
        let subject = lines[0].replace(/^Subject:\s*/i, '').trim();
        let body = lines.slice(1).join('\n').trim();
        
        // If parsing failed, use base with variable replacement
        if (!subject || !body) {
            return generateUniqueEmail(baseSubject, baseBody, recipient, index, 'light', headers);
        }
        
        return { subject: sanitizeContent(subject), body: sanitizeContent(body) };
        
    } catch (error) {
        console.error('AI personalization error:', error);
        // Fallback to simple personalization
        return generateUniqueEmail(baseSubject, baseBody, recipient, index, 'light', headers);
    }
};

// Helper function to get SMTP config
const getSmtpConfig = async (userId, smtpId) => {
    try {
        const result = await db.query(
            'SELECT * FROM smtp_accounts WHERE user_id = $1 AND id = $2',
            [userId, smtpId]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error getting SMTP config:', error);
        return null;
    }
};

// Execute tool function
const executeTool = async (toolName, args, context, userId) => {
    console.log(`Executing tool: ${toolName}`, args);

    switch (toolName) {
        // Preview single email - shows preview with confirm button
        case 'preview_single_email': {
            const { recipientName, subject, body } = args;
            const recipients = context?.recipients || [];

            if (recipients.length === 0) {
                return {
                    success: false,
                    message: 'No recipients found. Please upload a CSV file first.'
                };
            }

            // Find the specific recipient by name
            const searchTerm = recipientName.toLowerCase().trim();
            const recipient = recipients.find(r => {
                const name = (r.name || '').toLowerCase();
                const email = (r.email || '').toLowerCase();
                const firstName = name.split(' ')[0];
                return name.includes(searchTerm) ||
                    email.includes(searchTerm) ||
                    firstName === searchTerm;
            });

            if (!recipient) {
                return {
                    success: false,
                    message: `Could not find "${recipientName}". Available: ${recipients.slice(0, 5).map(r => r.name || r.email).join(', ')}`
                };
            }

            // Return preview data with confirm button
            return {
                success: true,
                action: 'show_preview',
                previewType: 'single',
                recipient: {
                    name: recipient.name || recipientName,
                    email: recipient.email
                },
                email: {
                    subject: sanitizeContent(subject),
                    body: sanitizeContent(body)
                },
                message: `Preview ready for ${recipient.name || recipient.email}`
            };
        }

        // Preview bulk campaign - shows sample previews
        case 'preview_bulk_campaign': {
            const { subject, body } = args;
            const recipients = context?.recipients || [];

            if (recipients.length === 0) {
                return {
                    success: false,
                    message: 'No recipients found. Please upload a CSV file first.'
                };
            }

            // Generate sample previews for first 3 recipients
            const samples = recipients.slice(0, 3).map(r => ({
                name: r.name || r.email,
                email: r.email,
                subject: sanitizeContent(personalizeContent(subject, r)),
                bodyPreview: sanitizeContent(personalizeContent(body, r)).substring(0, 150) + '...'
            }));

            return {
                success: true,
                action: 'show_preview',
                previewType: 'bulk',
                totalRecipients: recipients.length,
                samples: samples,
                template: {
                    subject: sanitizeContent(subject),
                    body: sanitizeContent(body)
                },
                message: `Preview ready for ${recipients.length} recipients`
            };
        }

        case 'send_test_email': {
            const { subject, body, testEmail } = args;

            // For demo, just log the test email
            return {
                success: true,
                message: `Test email sent to ${testEmail}`,
                preview: {
                    to: testEmail,
                    subject: subject,
                    bodyPreview: body.substring(0, 200) + '...'
                }
            };
        }

        case 'get_campaign_stats': {
            try {
                const result = await db.query(
                    `SELECT 
                        COUNT(*) as total_campaigns,
                        SUM(sent_count) as total_sent,
                        SUM(failed_count) as total_failed
                     FROM campaigns WHERE user_id = $1`,
                    [userId]
                );

                const stats = result.rows[0];
                return {
                    success: true,
                    stats: {
                        totalCampaigns: parseInt(stats.total_campaigns) || 0,
                        totalSent: parseInt(stats.total_sent) || 0,
                        totalFailed: parseInt(stats.total_failed) || 0,
                        successRate: stats.total_sent > 0
                            ? ((stats.total_sent / (stats.total_sent + stats.total_failed)) * 100).toFixed(1) + '%'
                            : 'N/A'
                    }
                };
            } catch (error) {
                return {
                    success: false,
                    message: `Error getting stats: ${error.message}`
                };
            }
        }

        case 'insert_email_content': {
            const { subject, body } = args;
            const recipients = context?.recipients || [];
            
            // If there are recipients, generate unique emails for each
            if (recipients.length > 0) {
                // Redirect to personalize_all_emails
                return await executeTool('personalize_all_emails', {
                    baseSubject: subject,
                    baseBody: body,
                    personalizationStyle: 'medium'
                }, context, userId);
            }
            
            // No recipients yet, just insert the template
            return {
                success: true,
                action: 'insert_content',
                subject: sanitizeContent(subject),
                body: sanitizeContent(body),
                message: 'Email template saved. Upload recipients to generate unique emails for each person.'
            };
        }

        case 'personalize_all_emails': {
            const { baseSubject, baseBody, personalizationStyle = 'medium' } = args;
            const recipients = context?.recipients || [];

            if (recipients.length === 0) {
                return {
                    success: false,
                    message: 'No recipients found. Please upload a CSV file first.'
                };
            }

            // Generate unique personalized content for each recipient
            const personalizedEmails = [];
            
            for (let i = 0; i < recipients.length; i++) {
                const r = recipients[i];
                const personalizedEmail = await generateUniqueEmail(
                    baseSubject, 
                    baseBody, 
                    r, 
                    i, 
                    personalizationStyle,
                    context?.headers || []
                );
                personalizedEmails.push({
                    email: r.email,
                    name: r.name || r.email,
                    subject: sanitizeContent(personalizedEmail.subject),
                    body: sanitizeContent(personalizedEmail.body)
                });
            }

            // Return preview with personalized emails data
            return {
                success: true,
                action: 'show_personalized_preview',
                totalRecipients: recipients.length,
                personalizedEmails: personalizedEmails,
                samples: personalizedEmails.slice(0, 3).map(e => ({
                    email: e.email,
                    name: e.name,
                    subject: e.subject,
                    bodyPreview: e.body.substring(0, 150) + '...'
                })),
                template: {
                    subject: sanitizeContent(baseSubject),
                    body: sanitizeContent(baseBody)
                },
                message: `Generated ${personalizedEmails.length} unique personalized emails. Each recipient will receive a custom message.`
            };
        }

        case 'update_email_content': {
            const { newSubject, newBody, modification } = args;
            return {
                success: true,
                action: 'insert_content',
                subject: sanitizeContent(newSubject) || null,
                body: sanitizeContent(newBody) || null,
                message: modification || 'Email content updated.'
            };
        }

        case 'edit_selected_text': {
            const { selectedText, editedText, recipientEmail, editDescription } = args;
            return {
                success: true,
                action: 'replace_selection',
                selectedText: selectedText,
                editedText: sanitizeContent(editedText),
                recipientEmail: recipientEmail || null,
                message: editDescription || 'Selected text has been edited.'
            };
        }

        default:
            return {
                success: false,
                message: `Unknown tool: ${toolName}`
            };
    }
};

// Chat with Mistral AI (with tool calling)
router.post('/chat', auth, async (req, res) => {
    try {
        const { messages, context } = req.body;
        const userId = req.user.id;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const apiKey = process.env.MISTRAL_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Mistral API key not configured' });
        }

        // Build context-aware system message
        let contextInfo = '';
        if (context) {
            if (context.recipientCount) {
                contextInfo += `\n\nCurrent campaign context: Working with ${context.recipientCount} recipients.`;
            }
            if (context.headers && context.headers.length > 0) {
                contextInfo += `\nAvailable personalization fields: ${context.headers.map(h => `{{${h}}}`).join(', ')}`;
            }
            if (context.recipients && context.recipients.length > 0) {
                const sampleRecipients = context.recipients.slice(0, 5);
                contextInfo += `\n\nSample recipients from the uploaded CSV:`;
                sampleRecipients.forEach((r, i) => {
                    const fields = Object.entries(r)
                        .map(([key, value]) => `${key}: "${value}"`)
                        .join(', ');
                    contextInfo += `\n  ${i + 1}. ${fields}`;
                });
                if (context.recipients.length > 5) {
                    contextInfo += `\n  ... and ${context.recipients.length - 5} more recipients`;
                }
            }
            if (context.currentSubject) {
                contextInfo += `\nCurrent subject line: "${context.currentSubject}"`;
            }
            if (context.currentBody) {
                contextInfo += `\nCurrent email body preview: "${context.currentBody.substring(0, 200)}..."`;
            }
        }

        const systemMessage = SYSTEM_PROMPT + contextInfo;

        // Format messages for Mistral API
        const formattedMessages = [
            { role: 'system', content: systemMessage },
            ...messages.map(m => ({
                role: m.role,
                content: m.content
            }))
        ];

        // First API call with tools
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: formattedMessages,
                tools: TOOLS,
                tool_choice: 'auto',
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Mistral API error:', error);
            return res.status(response.status).json({ error: 'AI service error' });
        }

        const data = await response.json();
        const assistantMessage = data.choices?.[0]?.message;

        // Check if AI wants to use a tool
        if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
            const toolResults = [];

            for (const toolCall of assistantMessage.tool_calls) {
                const toolName = toolCall.function.name;
                const toolArgs = JSON.parse(toolCall.function.arguments);

                // Execute the tool
                const result = await executeTool(toolName, toolArgs, context, userId);
                toolResults.push({
                    toolCallId: toolCall.id,
                    toolName,
                    result
                });
            }

            // Return tool results along with any message
            const textContent = assistantMessage.content || '';

            // Create user-friendly summaries without exposing tool names
            const toolSummary = toolResults.map(r => {
                if (r.result.success) {
                    // Just show the message without tool name
                    return `✅ ${r.result.message}`;
                } else {
                    return `❌ ${r.result.message}`;
                }
            }).join('\n\n');

            // Check for insert_content action
            const insertAction = toolResults.find(r => r.result.action === 'insert_content');

            res.json({
                message: sanitizeContent(textContent + (toolSummary ? `\n\n${toolSummary}` : '')),
                toolResults: toolResults.map(r => ({ ...r, toolName: undefined })), // Hide tool names
                insertContent: insertAction ? {
                    subject: sanitizeContent(insertAction.result.subject),
                    body: sanitizeContent(insertAction.result.body)
                } : null,
                usage: data.usage
            });
        } else {
            // No tool calls, just return the message
            const aiMessage = assistantMessage?.content || 'I apologize, but I could not generate a response.';
            res.json({
                message: sanitizeContent(aiMessage),
                usage: data.usage
            });
        }

    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ error: 'Failed to process AI request' });
    }
});

// Generate email content (simplified)
router.post('/generate-email', auth, async (req, res) => {
    try {
        const { type, context, tone, length } = req.body;

        const apiKey = process.env.MISTRAL_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Mistral API key not configured' });
        }

        let prompt = '';
        switch (type) {
            case 'cold-outreach':
                prompt = `Write a compelling cold outreach email. Tone: ${tone || 'professional'}. Length: ${length || 'medium'}.`;
                break;
            case 'follow-up':
                prompt = `Write a follow-up email for someone who hasn't responded. Tone: ${tone || 'friendly'}. Length: ${length || 'short'}.`;
                break;
            case 'newsletter':
                prompt = `Write an engaging newsletter email. Tone: ${tone || 'informative'}. Length: ${length || 'medium'}.`;
                break;
            case 'promotional':
                prompt = `Write a promotional email that drives action. Tone: ${tone || 'exciting'}. Length: ${length || 'medium'}.`;
                break;
            default:
                prompt = `Write a professional email. Tone: ${tone || 'professional'}. Length: ${length || 'medium'}.`;
        }

        if (context?.headers) {
            prompt += ` Use these personalization fields: ${context.headers.map(h => `{{${h}}}`).join(', ')}`;
        }

        if (context?.recipients && context.recipients.length > 0) {
            const sample = context.recipients.slice(0, 3);
            prompt += ` Here are sample recipients: `;
            sample.forEach((r, i) => {
                const fields = Object.entries(r).map(([k, v]) => `${k}: "${v}"`).join(', ');
                prompt += `[${i + 1}] ${fields}; `;
            });
        }

        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.8,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'AI service error' });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Extract subject and body
        let subject = '';
        let body = content;

        const subjectMatch = content.match(/Subject[:\s]+(.+?)(?:\n|$)/i);
        if (subjectMatch) {
            subject = subjectMatch[1].trim().replace(/^["']|["']$/g, '');
            body = content.replace(subjectMatch[0], '').trim();
        }

        body = body.replace(/^[-—]+\s*/gm, '').trim();

        res.json({ subject, body });

    } catch (error) {
        console.error('Generate email error:', error);
        res.status(500).json({ error: 'Failed to generate email' });
    }
});

// Optimize subject line
router.post('/optimize-subject', auth, async (req, res) => {
    try {
        const { currentSubject, context } = req.body;

        const apiKey = process.env.MISTRAL_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Mistral API key not configured' });
        }

        let prompt = `Generate 5 optimized subject line variations that will improve open rates.`;
        if (currentSubject) {
            prompt += ` Current subject: "${currentSubject}"`;
        }
        if (context?.headers) {
            prompt += ` Available personalization fields: ${context.headers.map(h => `{{${h}}}`).join(', ')}`;
        }
        prompt += ` Return only the 5 subject lines, one per line, numbered 1-5.`;

        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.9,
                max_tokens: 256
            })
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'AI service error' });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        const subjects = content
            .split('\n')
            .map(line => line.replace(/^\d+[\.)\s]*/, '').replace(/^["']|["']$/g, '').trim())
            .filter(line => line.length > 0 && line.length < 100);

        res.json({ subjects: subjects.slice(0, 5) });

    } catch (error) {
        console.error('Optimize subject error:', error);
        res.status(500).json({ error: 'Failed to optimize subject' });
    }
});

// Confirm and send - called when user clicks "Confirm Send" button
router.post('/confirm-send', auth, async (req, res) => {
    try {
        const { sendType, recipient, recipients, template, email } = req.body;

        const CAMPAIGNS_TABLE = 'EmailCampaigns';
        const EMAIL_LOGS_TABLE = 'EmailLogs';

        // Get SMTP config from environment
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = Number(process.env.SMTP_PORT) || 587;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const smtpFrom = process.env.SMTP_FROM || smtpUser;

        if (!smtpHost || !smtpUser || !smtpPass) {
            return res.status(400).json({
                error: 'SMTP not configured. Please add SMTP_HOST, SMTP_USER, SMTP_PASS to .env file.'
            });
        }

        // Create nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        if (sendType === 'single') {
            // Send to single recipient
            const campaignId = uuidv4();
            const campaignName = `Email to ${recipient.name}`;
            let emailStatus = 'sent';

            try {
                // Actually send the email
                await transporter.sendMail({
                    from: `"BulkMail" <${smtpFrom}>`,
                    to: recipient.email,
                    subject: email.subject,
                    text: email.body.replace(/<[^>]*>/g, ''),
                    html: email.body,
                });
                console.log(`✅ Email sent to ${recipient.email}`);
            } catch (smtpError) {
                console.error(`❌ Failed to send to ${recipient.email}:`, smtpError.message);
                emailStatus = 'failed';
            }

            // Create campaign in DynamoDB
            await db.put({
                TableName: CAMPAIGNS_TABLE,
                Item: {
                    id: campaignId,
                    name: campaignName,
                    subject: email.subject,
                    htmlContent: email.body,
                    status: emailStatus === 'sent' ? 'completed' : 'failed',
                    totalRecipients: 1,
                    sentCount: emailStatus === 'sent' ? 1 : 0,
                    failedCount: emailStatus === 'failed' ? 1 : 0,
                    recipients: [{ email: recipient.email, name: recipient.name }],
                    createdAt: new Date().toISOString(),
                    completedAt: new Date().toISOString()
                }
            }).promise();

            // Create email log
            await db.put({
                TableName: EMAIL_LOGS_TABLE,
                Item: {
                    id: uuidv4(),
                    campaignId,
                    email: recipient.email,
                    status: emailStatus,
                    sentAt: new Date().toISOString()
                }
            }).promise();

            transporter.close();

            if (emailStatus === 'sent') {
                res.json({
                    success: true,
                    message: `Email sent to ${recipient.name} (${recipient.email})`
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: `Failed to send email to ${recipient.email}`
                });
            }

        } else if (sendType === 'bulk') {
            // Send to all recipients with template-based personalization
            const campaignId = uuidv4();
            const campaignName = `Bulk Campaign - ${new Date().toLocaleString()}`;

            // Create campaign in DynamoDB first
            await db.put({
                TableName: CAMPAIGNS_TABLE,
                Item: {
                    id: campaignId,
                    name: campaignName,
                    subject: template.subject,
                    htmlContent: template.body,
                    status: 'sending',
                    totalRecipients: recipients.length,
                    sentCount: 0,
                    failedCount: 0,
                    recipients: recipients,
                    createdAt: new Date().toISOString()
                }
            }).promise();

            // Send response immediately (process in background)
            res.json({
                success: true,
                message: `Sending to ${recipients.length} recipients...`
            });

            // Process emails in background
            let sentCount = 0;
            let failedCount = 0;

            for (const r of recipients) {
                const personalizedSubject = personalizeContent(template.subject, r);
                const personalizedBody = personalizeContent(template.body, r);
                let status = 'sent';

                try {
                    await transporter.sendMail({
                        from: `"BulkMail" <${smtpFrom}>`,
                        to: r.email,
                        subject: sanitizeContent(personalizedSubject),
                        text: sanitizeContent(personalizedBody.replace(/<[^>]*>/g, '')),
                        html: sanitizeContent(personalizedBody),
                    });
                    console.log(`✅ Sent to ${r.email}`);
                    sentCount++;
                } catch (smtpError) {
                    console.error(`❌ Failed ${r.email}:`, smtpError.message);
                    status = 'failed';
                    failedCount++;
                }

                // Log each email
                try {
                    await db.put({
                        TableName: EMAIL_LOGS_TABLE,
                        Item: {
                            id: uuidv4(),
                            campaignId,
                            email: r.email,
                            subject: personalizedSubject,
                            status,
                            sentAt: new Date().toISOString()
                        }
                    }).promise();
                } catch (dbErr) {
                    // Continue even if logging fails
                }

                // Add small delay between emails to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Update campaign status
            await db.update({
                TableName: CAMPAIGNS_TABLE,
                Key: { id: campaignId },
                UpdateExpression: 'SET #status = :status, sentCount = :sent, failedCount = :failed, completedAt = :completedAt',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: {
                    ':status': failedCount > 0 && sentCount === 0 ? 'failed' : 'completed',
                    ':sent': sentCount,
                    ':failed': failedCount,
                    ':completedAt': new Date().toISOString()
                }
            }).promise();

            transporter.close();
            console.log(`📧 Campaign complete: ${sentCount} sent, ${failedCount} failed`);

        } else if (sendType === 'personalized') {
            // Send AI-generated unique personalized emails to each recipient
            const { personalizedEmails } = req.body;
            
            if (!personalizedEmails || personalizedEmails.length === 0) {
                return res.status(400).json({ error: 'No personalized emails provided' });
            }

            const campaignId = uuidv4();
            const campaignName = `Personalized Campaign - ${new Date().toLocaleString()}`;

            // Create campaign in DynamoDB first
            await db.put({
                TableName: CAMPAIGNS_TABLE,
                Item: {
                    id: campaignId,
                    name: campaignName,
                    subject: 'Personalized Campaign',
                    htmlContent: 'AI-generated unique content per recipient',
                    status: 'sending',
                    totalRecipients: personalizedEmails.length,
                    sentCount: 0,
                    failedCount: 0,
                    recipients: personalizedEmails.map(e => ({ email: e.email, name: e.name })),
                    createdAt: new Date().toISOString()
                }
            }).promise();

            // Send response immediately (process in background)
            res.json({
                success: true,
                message: `Sending ${personalizedEmails.length} unique personalized emails...`
            });

            // Process emails in background - each with unique content
            let sentCount = 0;
            let failedCount = 0;

            for (const emailData of personalizedEmails) {
                let status = 'sent';

                try {
                    await transporter.sendMail({
                        from: `"BulkMail" <${smtpFrom}>`,
                        to: emailData.email,
                        subject: sanitizeContent(emailData.subject),
                        text: sanitizeContent(emailData.body.replace(/<[^>]*>/g, '')),
                        html: sanitizeContent(emailData.body),
                    });
                    console.log(`✅ Sent personalized email to ${emailData.email}`);
                    sentCount++;
                } catch (smtpError) {
                    console.error(`❌ Failed ${emailData.email}:`, smtpError.message);
                    status = 'failed';
                    failedCount++;
                }

                // Log each email with its unique content
                try {
                    await db.put({
                        TableName: EMAIL_LOGS_TABLE,
                        Item: {
                            id: uuidv4(),
                            campaignId,
                            email: emailData.email,
                            subject: emailData.subject,
                            body: emailData.body,
                            status,
                            sentAt: new Date().toISOString()
                        }
                    }).promise();
                } catch (dbErr) {
                    // Continue even if logging fails
                }

                // Add small delay between emails to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Update campaign status
            await db.update({
                TableName: CAMPAIGNS_TABLE,
                Key: { id: campaignId },
                UpdateExpression: 'SET #status = :status, sentCount = :sent, failedCount = :failed, completedAt = :completedAt',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: {
                    ':status': failedCount > 0 && sentCount === 0 ? 'failed' : 'completed',
                    ':sent': sentCount,
                    ':failed': failedCount,
                    ':completedAt': new Date().toISOString()
                }
            }).promise();

            transporter.close();
            console.log(`📧 Personalized campaign complete: ${sentCount} sent, ${failedCount} failed`);

        } else {
            res.status(400).json({ error: 'Invalid send type' });
        }

    } catch (error) {
        console.error('Confirm send error:', error);
        res.status(500).json({ error: 'Failed to send emails: ' + error.message });
    }
});

export default router;

