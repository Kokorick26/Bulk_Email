# Bulk Email Manager

A powerful, standalone bulk email management system with SMTP support, campaign tracking, and template management.

## Features

- 📧 **Bulk Email Sending** - Send emails to hundreds of recipients at once
- 🔐 **Multiple SMTP Accounts** - Manage and switch between multiple sender accounts
- 📊 **Campaign Tracking** - Track sent, failed, and pending emails in real-time
- 📝 **Email Templates** - Save and reuse email templates
- 🔄 **Auto-Refresh** - Real-time status updates on the history tab
- 📱 **Responsive UI** - Modern dark theme with beautiful animations
- 🛡️ **Secure** - JWT authentication and password encryption

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: AWS DynamoDB
- **Email**: Nodemailer with SMTP

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Kokorick26/Bulk_Email.git
cd Bulk_Email
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000

# AWS Configuration (Required for DynamoDB)
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Security
JWT_SECRET=your_jwt_secret_here

# SMTP Email Configuration
SMTP_HOST=smtppro.zoho.eu
SMTP_PORT=465
SMTP_USER=your-email@domain.com
SMTP_PASS=your_app_password
SMTP_FROM=your-email@domain.com
```

### 4. Setup DynamoDB tables

```bash
npm run setup-db
```

### 5. Run the application

```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### SMTP Accounts
- `GET /api/bulk-email/smtp-accounts` - List all SMTP accounts
- `POST /api/bulk-email/smtp-accounts` - Create SMTP account
- `PUT /api/bulk-email/smtp-accounts/:id` - Update SMTP account
- `DELETE /api/bulk-email/smtp-accounts/:id` - Delete SMTP account
- `POST /api/bulk-email/smtp-accounts/:id/test` - Test SMTP connection

### Quick Send
- `POST /api/bulk-email/quick-send` - Send emails immediately

### Campaigns
- `GET /api/bulk-email/campaigns` - List all campaigns
- `GET /api/bulk-email/campaigns/:id` - Get campaign details with logs
- `DELETE /api/bulk-email/campaigns/:id` - Delete campaign

### Templates
- `GET /api/bulk-email/templates` - List all templates
- `POST /api/bulk-email/templates` - Create template
- `DELETE /api/bulk-email/templates/:id` - Delete template

### Stats
- `GET /api/bulk-email/stats` - Get email statistics

## SMTP Configuration

### Zoho Mail (Custom Domain)
```env
SMTP_HOST=smtppro.zoho.eu
SMTP_PORT=465
```

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Outlook/Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
```

## License

MIT License - feel free to use this project for your own purposes.

## Author

Built by [Kokorick](https://kokorick.uk)
