import 'dotenv/config';
import AWS from 'aws-sdk';

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function fixPasswords() {
    console.log('Fetching existing SMTP accounts...');

    const data = await dynamoDB.scan({ TableName: 'SmtpAccounts' }).promise();
    const acc = data.Items?.[0];

    if (!acc) {
        console.log('No account found!');
        return;
    }

    console.log('Found account:', acc.name);
    console.log('Current password set:', !!acc.password);
    console.log('Current imapPassword set:', !!acc.imapPassword);
    console.log('');
    console.log('ENV SMTP_PASS:', process.env.SMTP_PASS ? 'SET (' + process.env.SMTP_PASS.substring(0, 3) + '...)' : 'NOT SET');
    console.log('ENV IMAP_PASS:', process.env.IMAP_PASS ? 'SET (' + process.env.IMAP_PASS.substring(0, 3) + '...)' : 'NOT SET');

    const updated = {
        ...acc,
        password: process.env.SMTP_PASS,
        imapPassword: process.env.IMAP_PASS || process.env.SMTP_PASS,
        imapConfigured: true,
        imapHost: process.env.IMAP_HOST || acc.imapHost || 'imappro.zoho.eu',
        imapPort: Number(process.env.IMAP_PORT) || acc.imapPort || 993,
        imapUser: process.env.IMAP_USER || acc.imapUser || acc.username,
        imapTls: true,
        updatedAt: new Date().toISOString()
    };

    await dynamoDB.put({ TableName: 'SmtpAccounts', Item: updated }).promise();
    console.log('\n Passwords and IMAP config updated successfully!');
}

fixPasswords().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
