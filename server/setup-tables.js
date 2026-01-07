import 'dotenv/config';
import AWS from 'aws-sdk';

AWS.config.update({
    region: process.env.AWS_REGION || 'eu-west-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB();

const tables = [
    {
        TableName: 'EmailCampaigns',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST',
    },
    {
        TableName: 'EmailLogs',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'campaignId', AttributeType: 'S' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        GlobalSecondaryIndexes: [
            {
                IndexName: 'CampaignIdIndex',
                KeySchema: [{ AttributeName: 'campaignId', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' },
            },
        ],
    },
    {
        TableName: 'EmailTemplates',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST',
    },
    {
        TableName: 'SmtpAccounts',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST',
    },
    {
        TableName: 'BulkEmailUsers',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST',
    },
    {
        TableName: 'InboxMessages',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'accountId', AttributeType: 'S' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        GlobalSecondaryIndexes: [
            {
                IndexName: 'AccountIdIndex',
                KeySchema: [{ AttributeName: 'accountId', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' },
            },
        ],
    },
    {
        TableName: 'LeadProgress',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'campaignId', AttributeType: 'S' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        GlobalSecondaryIndexes: [
            {
                IndexName: 'CampaignIdIndex',
                KeySchema: [{ AttributeName: 'campaignId', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' },
            },
        ],
    },
    {
        TableName: 'LeadLists',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'userId', AttributeType: 'S' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        GlobalSecondaryIndexes: [
            {
                IndexName: 'UserIdIndex',
                KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' },
            },
        ],
    },
];

async function createTable(tableConfig) {
    const tableName = tableConfig.TableName;

    try {
        // Check if table exists
        await dynamoDB.describeTable({ TableName: tableName }).promise();
        console.log(` Table "${tableName}" already exists`);
        return;
    } catch (err) {
        if (err.code !== 'ResourceNotFoundException') {
            throw err;
        }
    }

    // Create table
    console.log(`Creating table "${tableName}"...`);
    await dynamoDB.createTable(tableConfig).promise();

    // Wait for table to be active
    console.log(`  Waiting for table to become active...`);
    await dynamoDB.waitFor('tableExists', { TableName: tableName }).promise();
    console.log(` Table "${tableName}" created successfully`);
}

async function setup() {
    console.log('Setting up Bulk Email tables...\n');

    for (const table of tables) {
        await createTable(table);
    }

    console.log('\n All tables setup complete!');
    console.log('\nTables:');
    console.log('  - EmailCampaigns: Stores email campaign data');
    console.log('  - EmailLogs: Stores individual email send logs');
    console.log('  - EmailTemplates: Stores reusable email templates');
    console.log('  - SmtpAccounts: Stores SMTP account configurations');
    console.log('  - BulkEmailUsers: Stores user accounts');
}

setup().catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
});
