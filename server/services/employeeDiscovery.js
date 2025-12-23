/**
 * Employee Discovery Service v3 - USING REAL APIs
 * Uses Hunter.io API (FREE tier - 25 searches/month)
 * Falls back to web scraping if no API key
 */
import { v4 as uuidv4 } from 'uuid';

const CONFIG = {
    MAX_EMPLOYEES: 8,
    REQUEST_TIMEOUT: 15000,
    DELAY_BETWEEN_REQUESTS: 300,
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

/**
 * Main discovery function
 */
export async function discoverEmployees(companyName, domain, website, targetRole, industry) {
    console.log(`\n[EmployeeDiscovery] ========================================`);
    console.log(`[EmployeeDiscovery] Company: ${companyName}`);
    console.log(`[EmployeeDiscovery] Domain: ${domain}`);
    console.log(`[EmployeeDiscovery] ========================================\n`);

    const employees = [];
    const seenEmails = new Set();

    // Method 1: Hunter.io API (FREE - gives real verified emails!)
    const hunterApiKey = process.env.HUNTER_API_KEY;
    if (hunterApiKey) {
        console.log(`[EmployeeDiscovery] Method 1: Hunter.io API (verified data)...`);
        try {
            const hunterResults = await searchHunterIO(domain, hunterApiKey);
            addUnique(employees, hunterResults, seenEmails);
            console.log(`[EmployeeDiscovery] Hunter.io found: ${hunterResults.length} verified contacts`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] Hunter.io error: ${e.message}`);
        }
    } else {
        console.log(`[EmployeeDiscovery] No HUNTER_API_KEY - skipping Hunter.io`);
    }

    // Method 2: Apollo.io API (FREE tier available)
    const apolloApiKey = process.env.APOLLO_API_KEY;
    if (apolloApiKey && employees.length < CONFIG.MAX_EMPLOYEES) {
        console.log(`[EmployeeDiscovery] Method 2: Apollo.io API...`);
        try {
            const apolloResults = await searchApollo(companyName, domain, apolloApiKey);
            addUnique(employees, apolloResults, seenEmails);
            console.log(`[EmployeeDiscovery] Apollo found: ${apolloResults.length} contacts`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] Apollo error: ${e.message}`);
        }
    }

    // Method 3: GitHub org search (free, no API key needed)
    if (employees.length < CONFIG.MAX_EMPLOYEES) {
        console.log(`[EmployeeDiscovery] Method 3: GitHub org search...`);
        try {
            const githubResults = await searchGitHub(companyName, domain);
            addUnique(employees, githubResults, seenEmails);
            console.log(`[EmployeeDiscovery] GitHub found: ${githubResults.length} people`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] GitHub error: ${e.message}`);
        }
    }

    // Method 4: Company website scraping (fallback)
    if (employees.length < CONFIG.MAX_EMPLOYEES) {
        console.log(`[EmployeeDiscovery] Method 4: Website scraping...`);
        try {
            const websiteResults = await scrapeWebsite(companyName, domain, website);
            addUnique(employees, websiteResults, seenEmails);
            console.log(`[EmployeeDiscovery] Website found: ${websiteResults.length} people`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] Website error: ${e.message}`);
        }
    }

    console.log(`\n[EmployeeDiscovery] TOTAL: ${employees.length} employees found`);
    console.log(`[EmployeeDiscovery] ========================================\n`);

    return employees.slice(0, CONFIG.MAX_EMPLOYEES);
}

function addUnique(target, source, seenEmails) {
    for (const emp of source) {
        if (target.length >= CONFIG.MAX_EMPLOYEES) break;
        const key = emp.email?.toLowerCase() || emp.name?.toLowerCase();
        if (key && !seenEmails.has(key)) {
            seenEmails.add(key);
            target.push(emp);
            console.log(`[EmployeeDiscovery] ✓ Added: ${emp.name} - ${emp.role} (${emp.source})`);
        }
    }
}

/**
 * Method 1: Hunter.io Domain Search API
 * FREE tier: 25 searches/month
 * Returns REAL verified employee emails
 * Sign up: https://hunter.io/api
 */
async function searchHunterIO(domain, apiKey) {
    const employees = [];

    try {
        // Domain search - returns all known emails for a domain
        const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}&limit=10`;

        console.log(`[EmployeeDiscovery] Hunter.io: Searching ${domain}...`);

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
        });

        if (!response.ok) {
            const error = await response.text();
            console.log(`[EmployeeDiscovery] Hunter.io API error: ${response.status} - ${error}`);
            return employees;
        }

        const data = await response.json();

        if (data.data?.emails) {
            for (const contact of data.data.emails) {
                if (!contact.first_name || !contact.last_name) continue;

                const name = `${contact.first_name} ${contact.last_name}`;

                employees.push({
                    id: uuidv4(),
                    name: name,
                    role: contact.position || contact.department || 'Employee',
                    email: contact.value,
                    emailConfidence: contact.confidence > 90 ? 'verified' : contact.confidence > 50 ? 'likely' : 'pattern',
                    linkedInUrl: contact.linkedin || `https://linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`,
                    department: contact.department || getDepartment(contact.position),
                    source: 'Hunter.io (Verified)'
                });
            }
        }

        console.log(`[EmployeeDiscovery] Hunter.io returned ${employees.length} verified emails`);

    } catch (e) {
        console.log(`[EmployeeDiscovery] Hunter.io error: ${e.message}`);
    }

    return employees;
}

/**
 * Method 2: Apollo.io People Search API
 * FREE tier: 50 credits/month
 * Sign up: https://app.apollo.io/
 */
async function searchApollo(companyName, domain, apiKey) {
    const employees = [];

    try {
        const url = 'https://api.apollo.io/v1/mixed_people/search';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'X-Api-Key': apiKey
            },
            body: JSON.stringify({
                q_organization_domains: domain,
                page: 1,
                per_page: 10
            }),
            signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
        });

        if (!response.ok) return employees;

        const data = await response.json();

        if (data.people) {
            for (const person of data.people) {
                if (!person.first_name || !person.last_name) continue;

                const name = `${person.first_name} ${person.last_name}`;

                employees.push({
                    id: uuidv4(),
                    name: name,
                    role: person.title || 'Employee',
                    email: person.email || generateEmail(name, domain),
                    emailConfidence: person.email ? 'verified' : 'pattern',
                    linkedInUrl: person.linkedin_url || `https://linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`,
                    department: getDepartment(person.title),
                    source: 'Apollo.io'
                });
            }
        }

    } catch (e) {
        console.log(`[EmployeeDiscovery] Apollo error: ${e.message}`);
    }

    return employees;
}

/**
 * Method 3: GitHub Organization Members
 * FREE - no API key needed
 */
async function searchGitHub(companyName, domain) {
    const employees = [];

    const orgNames = [
        companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        companyName.toLowerCase().replace(/\s+/g, ''),
        domain.split('.')[0]
    ];

    for (const orgName of orgNames) {
        if (employees.length >= 3) break;

        try {
            const response = await fetch(`https://api.github.com/orgs/${orgName}/members?per_page=5`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'EmployeeDiscovery/1.0'
                },
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) continue;
            const members = await response.json();

            for (const member of members.slice(0, 3)) {
                const userResp = await fetch(`https://api.github.com/users/${member.login}`, {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'EmployeeDiscovery/1.0'
                    }
                });

                if (!userResp.ok) continue;
                const user = await userResp.json();

                if (user.name && user.name.split(' ').length >= 2) {
                    employees.push({
                        id: uuidv4(),
                        name: user.name,
                        role: user.bio?.slice(0, 50) || 'Developer',
                        email: user.email || generateEmail(user.name, domain),
                        emailConfidence: user.email ? 'verified' : 'pattern',
                        linkedInUrl: `https://linkedin.com/search/results/people/?keywords=${encodeURIComponent(user.name)}`,
                        department: 'Technology',
                        source: 'GitHub'
                    });
                }
            }

            if (members.length > 0) break;
        } catch { }
    }

    return employees;
}

/**
 * Method 4: Website Team Page Scraping (fallback)
 */
async function scrapeWebsite(companyName, domain, website) {
    const employees = [];

    const paths = ['/about', '/team', '/about-us', '/leadership', '/people'];
    const baseUrl = website?.replace(/\/$/, '') || `https://${domain}`;

    for (const path of paths) {
        if (employees.length >= 4) break;

        try {
            const response = await fetch(`${baseUrl}${path}`, {
                headers: { 'User-Agent': CONFIG.USER_AGENT },
                signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT),
                redirect: 'follow'
            });

            if (!response.ok) continue;
            const html = await response.text();

            // Extract structured data (JSON-LD)
            const jsonLdPattern = /"@type"\s*:\s*"Person"[^}]*"name"\s*:\s*"([^"]+)"[^}]*"jobTitle"\s*:\s*"([^"]+)"/gi;
            let match;
            while ((match = jsonLdPattern.exec(html)) !== null && employees.length < 6) {
                const name = match[1];
                const role = match[2];

                if (isValidName(name)) {
                    employees.push({
                        id: uuidv4(),
                        name,
                        role: role.slice(0, 60),
                        email: generateEmail(name, domain),
                        emailConfidence: 'pattern',
                        linkedInUrl: `https://linkedin.com/search/results/people/?keywords=${encodeURIComponent(name + ' ' + companyName)}`,
                        department: getDepartment(role),
                        source: 'Website'
                    });
                }
            }
        } catch { }
    }

    return employees;
}

// Helper functions
function isValidName(name) {
    if (!name || typeof name !== 'string') return false;
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2 || parts.length > 4) return false;
    if (name.length < 5 || name.length > 50) return false;

    // Block common non-names
    const blocked = ['job', 'career', 'hiring', 'team', 'company', 'seekers'];
    if (blocked.some(b => name.toLowerCase().includes(b))) return false;

    return true;
}

function generateEmail(name, domain) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.toLowerCase().replace(/[^a-z]/g, '') || 'contact';
    const last = parts[parts.length - 1]?.toLowerCase().replace(/[^a-z]/g, '') || '';
    return `${first}.${last}@${domain}`;
}

function getDepartment(role) {
    const r = (role || '').toLowerCase();
    if (/ceo|founder|president/i.test(r)) return 'Executive';
    if (/cto|engineer|developer|tech/i.test(r)) return 'Technology';
    if (/marketing|growth/i.test(r)) return 'Marketing';
    if (/sales|business/i.test(r)) return 'Sales';
    if (/operations/i.test(r)) return 'Operations';
    if (/finance/i.test(r)) return 'Finance';
    if (/hr|people/i.test(r)) return 'Human Resources';
    if (/product/i.test(r)) return 'Product';
    if (/design/i.test(r)) return 'Design';
    return 'General';
}

export default { discoverEmployees };
