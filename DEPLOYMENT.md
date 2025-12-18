# AWS EC2 Deployment Guide for BulkMail

This guide walks you through deploying BulkMail on AWS EC2.

## Prerequisites

1. AWS Account with EC2 access
2. Domain name (optional but recommended)
3. AWS credentials (Access Key ID & Secret Access Key)
4. Mistral AI API Key

---

## Step 1: Launch EC2 Instance

### 1.1 Create Instance
1. Go to AWS Console → EC2 → **Launch Instance**
2. **Name**: `bulkmail-server`
3. **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
4. **Instance Type**: `t2.small` or `t2.medium` (recommended for production)
5. **Key Pair**: Create new or use existing (download `.pem` file)

### 1.2 Configure Security Group
Create or select a security group with these inbound rules:

| Type  | Port | Source    | Description       |
|-------|------|-----------|-------------------|
| SSH   | 22   | Your IP   | SSH access        |
| HTTP  | 80   | 0.0.0.0/0 | Web traffic       |
| HTTPS | 443  | 0.0.0.0/0 | Secure web traffic|
| Custom| 3000 | 0.0.0.0/0 | Node.js (dev only)|
| Custom| 5173 | 0.0.0.0/0 | Vite dev (dev only)|

### 1.3 Configure Storage
- **Size**: 20GB gp3 (recommended)
- Enable "Delete on termination" for dev, disable for production

### 1.4 Launch Instance
Click **Launch Instance** and wait for it to start.

---

## Step 2: Connect to EC2

```bash
# Make your key file secure
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

---

## Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

---

## Step 4: Clone and Setup Project

```bash
# Clone your repository (or upload files)
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/Bulk_Email.git
cd Bulk_Email

# Install dependencies
npm install

# Build the frontend
npm run build
```

---

## Step 5: Configure Environment Variables

```bash
# Create production .env file
nano .env
```

Add the following (replace with your actual values):

```env
# Server
NODE_ENV=production
PORT=3000

# AWS DynamoDB
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-west-2

# Mistral AI
MISTRAL_API_KEY=your_mistral_api_key

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# SMTP (optional - users can add via UI)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

---

## Step 6: Create DynamoDB Tables

In AWS Console → DynamoDB → Create tables:

### Required Tables:

1. **EmailCampaigns**
   - Partition key: `id` (String)

2. **EmailLogs**
   - Partition key: `id` (String)

3. **EmailTemplates**
   - Partition key: `id` (String)

4. **SmtpAccounts**
   - Partition key: `id` (String)

5. **NewsletterSubscribers**
   - Partition key: `email` (String)

6. **Users**
   - Partition key: `id` (String)

---

## Step 7: Configure Nginx Reverse Proxy

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/bulkmail
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or use _ for all

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

Enable the site:

```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/bulkmail /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Step 8: Start Application with PM2

```bash
# Navigate to project
cd /home/ubuntu/Bulk_Email

# Start the server with PM2
pm2 start npm --name "bulkmail" -- start

# Or for development:
# pm2 start npm --name "bulkmail" -- run dev

# Make PM2 start on boot
pm2 startup systemd
pm2 save
```

Useful PM2 commands:
```bash
pm2 status      # Check status
pm2 logs        # View logs
pm2 restart all # Restart app
pm2 stop all    # Stop app
```

---

## Step 9: Setup SSL (HTTPS) with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

---

## Step 10: Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Quick Start Script (All-in-One)

Create a setup script:

```bash
#!/bin/bash
# save as setup.sh

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# Install PM2
sudo npm install -g pm2

# Clone project
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/Bulk_Email.git
cd Bulk_Email

# Install dependencies and build
npm install
npm run build

# Start with PM2
pm2 start npm --name "bulkmail" -- start
pm2 startup systemd
pm2 save

echo "✅ Deployment complete! Configure your .env file and restart."
```

---

## Updating the Application

```bash
cd /home/ubuntu/Bulk_Email
git pull origin main
npm install
npm run build
pm2 restart all
```

---

## Troubleshooting

### Check Logs
```bash
pm2 logs bulkmail
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
pm2 restart all
sudo systemctl restart nginx
```

### Check Ports
```bash
sudo netstat -tlpn
```

### AWS DynamoDB Issues
- Check IAM permissions include DynamoDB access
- Verify region matches between code and AWS console

---

## Estimated Costs (Free Tier)

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| EC2 t2.micro | 750 hrs/month (1 year) | ~$8.50/month |
| DynamoDB | 25 GB + 25 WCU/RCU | Pay per use |
| Data Transfer | 100 GB/month | ~$0.09/GB |

**Recommendation**: Use `t2.small` (~$17/month) for better performance.

---

## Security Best Practices

1. ✅ Never commit `.env` to git
2. ✅ Use strong JWT_SECRET
3. ✅ Enable HTTPS with SSL
4. ✅ Restrict SSH to your IP only
5. ✅ Use IAM roles instead of access keys (advanced)
6. ✅ Enable AWS CloudWatch for monitoring
7. ✅ Set up AWS Budget alerts

---

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify DynamoDB tables exist and have correct names
4. Ensure all environment variables are set correctly
