import 'dotenv/config';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

AWS.config.update({
    region: process.env.AWS_REGION || 'eu-west-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const SMTP_ACCOUNTS_TABLE = 'SmtpAccounts';

// Akshat SMTP/IMAP configuration (hardcoded - not relying on env)
const bhaweshAccount = {
    id: uuidv4(),
    name: 'Akshat',
    host: 'smtppro.zoho.eu',
    port: 465,
    username: 'akshat@kokorick.uk',
    password: 'R79daS7xJXFe',
    fromEmail: 'akshat@kokorick.uk',
    fromName: 'Akshat',
    isDefault: true,
    isSystem: false,
    // IMAP Configuration
    imapConfigured: true,
    imapHost: 'imappro.zoho.eu',
    imapPort: 993,
    imapUser: 'akshat@kokorick.uk',
    imapPassword: 'R79daS7xJXFe',
    imapTls: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

async function seedSmtpAccount() {
    console.log('Seeding SMTP account to DynamoDB...\n');

    try {
        // Check if any accounts already exist
        const existing = await dynamoDB.scan({ TableName: SMTP_ACCOUNTS_TABLE }).promise();

        if (existing.Items && existing.Items.length > 0) {
            console.log(`Found ${existing.Items.length} existing SMTP account(s):`);
            existing.Items.forEach(acc => {
                console.log(`  - ${acc.name} (${acc.fromEmail}) - IMAP: ${acc.imapConfigured ? 'Yes' : 'No'}`);
            });

            // Ask if we should update or skip
            console.log('\nAccounts already exist. Checking if default needs IMAP update...');

            const defaultAcc = existing.Items.find(a => a.isDefault);
            if (defaultAcc && !defaultAcc.imapConfigured && process.env.IMAP_HOST) {
                console.log(`Updating default account "${defaultAcc.name}" with IMAP settings...`);

                const updated = Object.assign({}, defaultAcc, {
                    imapConfigured: true,
                    imapHost: process.env.IMAP_HOST || 'imappro.zoho.eu',
                    imapPort: Number(process.env.IMAP_PORT) || 993,
                    imapUser: process.env.IMAP_USER || defaultAcc.username,
                    imapPassword: process.env.IMAP_PASS || defaultAcc.password,
                    imapTls: true,
                    updatedAt: new Date().toISOString(),
                });

                await dynamoDB.put({ TableName: SMTP_ACCOUNTS_TABLE, Item: updated }).promise();
                console.log(' IMAP configuration added to existing default account!');
            } else if (defaultAcc && defaultAcc.imapConfigured) {
                console.log(' Default account already has IMAP configured. Nothing to do.');
            } else {
                console.log('No updates needed.');
            }
            return;
        }

        // No accounts exist, create the default one
        console.log('No SMTP accounts found. Creating default account...\n');
        console.log('Account Details:');
        console.log(`  Name: ${bhaweshAccount.name}`);
        console.log(`  Email: ${bhaweshAccount.fromEmail}`);
        console.log(`  SMTP Host: ${bhaweshAccount.host}:${bhaweshAccount.port}`);
        console.log(`  IMAP Host: ${bhaweshAccount.imapHost}:${bhaweshAccount.imapPort}`);
        console.log(`  IMAP Configured: ${bhaweshAccount.imapConfigured}`);

        await dynamoDB.put({ TableName: SMTP_ACCOUNTS_TABLE, Item: bhaweshAccount }).promise();

        console.log('\n Default SMTP account created successfully!');
        console.log('\nYou can now edit this account from the frontend at:');
        console.log('  Settings > SMTP Accounts');

    } catch (err) {
        if (err.code === 'ResourceNotFoundException') {
            console.error('Error: SmtpAccounts table does not exist.');
            console.log('Run "npm run setup-db" first to create the tables.');
        } else {
            console.error('Error seeding SMTP account:', err);
        }
        process.exit(1);
    }
}

seedSmtpAccount();
