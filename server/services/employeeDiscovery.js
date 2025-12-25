/**
 * Employee Discovery Service v5 - AI-POWERED DEEP RESEARCH ENGINE
 * Uses Mistral AI for intelligent analysis of search results
 * Multiple FREE data sources + AI enhancement
 */
import { v4 as uuidv4 } from 'uuid';

// Mistral AI Configuration
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

const CONFIG = {
    MAX_EMPLOYEES: 15,
    REQUEST_TIMEOUT: 20000,
    DELAY_BETWEEN_REQUESTS: 500,
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// AI System prompt for employee extraction - NO FAKE NAMES
const EMPLOYEE_EXTRACTION_PROMPT = `You are an expert at extracting REAL employee information from web content.

CRITICAL RULES:
1. ONLY extract names that are EXPLICITLY mentioned in the provided data
2. NEVER make up, guess, or generate fake names
3. NEVER use placeholder names like "John Smith", "Jane Doe", "John Doe", etc.
4. If you cannot find real names in the data, return an empty employees array: {"employees": []}
5. Extract only people confirmed to work at the specified company
6. Include job title/role if mentioned
7. Focus on executives: CEO, CTO, CFO, Founder, Co-Founder, Director, VP, Head, Manager

Return ONLY valid JSON in this exact format:
{
  "employees": [
    { "name": "REAL_NAME_FROM_DATA", "role": "ACTUAL_TITLE" }
  ]
}

If NO real employees are found in the data, return: {"employees": []}`;

// Blocklist of fake/placeholder names that should never be used
const FAKE_NAME_PATTERNS = [
    'john smith', 'jane doe', 'john doe', 'jane smith',
    'test user', 'sample name', 'example name', 'placeholder',
    'first last', 'your name', 'full name', 'real name'
];




/**
 * Main discovery function - orchestrates all search methods
 */
export async function discoverEmployees(companyName, domain, website, targetRole, industry) {
    console.log(`\n[EmployeeDiscovery] ========================================`);
    console.log(`[EmployeeDiscovery] AI-POWERED DEEP RESEARCH MODE`);
    console.log(`[EmployeeDiscovery] Company: ${companyName}`);
    console.log(`[EmployeeDiscovery] Domain: ${domain}`);
    console.log(`[EmployeeDiscovery] Target Role: ${targetRole || 'Any'}`);
    console.log(`[EmployeeDiscovery] ========================================\n`);

    const employees = [];
    const seenEmails = new Set();
    const seenNames = new Set();

    // ============ AI-POWERED RESEARCH (PRIORITY) ============

    // Method 1: MISTRAL AI Deep Research (if API key available)
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    if (mistralApiKey) {
        console.log(`[EmployeeDiscovery] Method 1: 🤖 MISTRAL AI Deep Research...`);
        try {
            const aiResults = await searchWithMistralAI(companyName, domain, website, targetRole, mistralApiKey);
            addUnique(employees, aiResults, seenEmails, seenNames);
            console.log(`[EmployeeDiscovery] Mistral AI found: ${aiResults.length} people`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] Mistral AI error: ${e.message}`);
        }
    } else {
        console.log(`[EmployeeDiscovery] No MISTRAL_API_KEY - using fallback methods`);
    }

    // Method 2: Hunter.io API (if available - optional)
    const hunterApiKey = process.env.HUNTER_API_KEY;
    if (hunterApiKey && employees.length < CONFIG.MAX_EMPLOYEES) {
        console.log(`[EmployeeDiscovery] Method 2: Hunter.io API...`);
        try {
            const hunterResults = await searchHunterIO(domain, hunterApiKey);
            addUnique(employees, hunterResults, seenEmails, seenNames);
            console.log(`[EmployeeDiscovery] Hunter.io found: ${hunterResults.length} contacts`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] Hunter.io error: ${e.message}`);
        }
    }

    // Method 3: Apollo.io API (if available - optional)
    const apolloApiKey = process.env.APOLLO_API_KEY;
    if (apolloApiKey && employees.length < CONFIG.MAX_EMPLOYEES) {
        console.log(`[EmployeeDiscovery] Method 3: Apollo.io API...`);
        try {
            const apolloResults = await searchApollo(companyName, domain, apolloApiKey);
            addUnique(employees, apolloResults, seenEmails, seenNames);
            console.log(`[EmployeeDiscovery] Apollo found: ${apolloResults.length} contacts`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] Apollo error: ${e.message}`);
        }
    }

    // ============ FREE DEEP RESEARCH METHODS ============

    // Method 4: Dedicated Executive/C-Suite Search (FREE - PRIORITY)
    // Every company has executives - this specifically targets CEO, Founders, CTO
    if (employees.length < CONFIG.MAX_EMPLOYEES) {
        console.log(`[EmployeeDiscovery] Method 4: Executive/C-Suite search...`);
        try {
            const executiveResults = await searchExecutives(companyName, domain, website);
            addUnique(employees, executiveResults, seenEmails, seenNames);
            console.log(`[EmployeeDiscovery] Executive search found: ${executiveResults.length} people`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] Executive search error: ${e.message}`);
        }
    }

    // Method 4: GitHub Organization Members (FREE)
    if (employees.length < CONFIG.MAX_EMPLOYEES) {
        console.log(`[EmployeeDiscovery] Method 4: GitHub organization search...`);
        try {
            const githubResults = await searchGitHub(companyName, domain);
            addUnique(employees, githubResults, seenEmails, seenNames);
            console.log(`[EmployeeDiscovery] GitHub found: ${githubResults.length} people`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] GitHub error: ${e.message}`);
        }
    }

    // Method 4: LinkedIn Public Search via DuckDuckGo (FREE)
    if (employees.length < CONFIG.MAX_EMPLOYEES) {
        console.log(`[EmployeeDiscovery] Method 4: LinkedIn search via DuckDuckGo...`);
        try {
            const linkedInResults = await searchLinkedInViaDuckDuckGo(companyName, domain, targetRole);
            addUnique(employees, linkedInResults, seenEmails, seenNames);
            console.log(`[EmployeeDiscovery] LinkedIn search found: ${linkedInResults.length} people`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] LinkedIn search error: ${e.message}`);
        }
    }

    // Method 5: Google Search for Company Employees (FREE)
    if (employees.length < CONFIG.MAX_EMPLOYEES) {
        console.log(`[EmployeeDiscovery] Method 5: Google web search...`);
        try {
            const googleResults = await searchGoogleForEmployees(companyName, domain, targetRole);
            addUnique(employees, googleResults, seenEmails, seenNames);
            console.log(`[EmployeeDiscovery] Google search found: ${googleResults.length} people`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] Google search error: ${e.message}`);
        }
    }

    // Method 6: Company Website Deep Scrape (FREE)
    if (employees.length < CONFIG.MAX_EMPLOYEES) {
        console.log(`[EmployeeDiscovery] Method 6: Website deep scraping...`);
        try {
            const websiteResults = await scrapeWebsite(companyName, domain, website);
            addUnique(employees, websiteResults, seenEmails, seenNames);
            console.log(`[EmployeeDiscovery] Website scraping found: ${websiteResults.length} people`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] Website scraping error: ${e.message}`);
        }
    }

    // Method 7: Crunchbase Public Data (FREE)
    if (employees.length < CONFIG.MAX_EMPLOYEES) {
        console.log(`[EmployeeDiscovery] Method 7: Crunchbase search...`);
        try {
            const crunchbaseResults = await searchCrunchbase(companyName, domain);
            addUnique(employees, crunchbaseResults, seenEmails, seenNames);
            console.log(`[EmployeeDiscovery] Crunchbase found: ${crunchbaseResults.length} people`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] Crunchbase error: ${e.message}`);
        }
    }

    // Method 8: Twitter/X Company Mentions (FREE)
    if (employees.length < CONFIG.MAX_EMPLOYEES) {
        console.log(`[EmployeeDiscovery] Method 8: Twitter/X search...`);
        try {
            const twitterResults = await searchTwitter(companyName, domain);
            addUnique(employees, twitterResults, seenEmails, seenNames);
            console.log(`[EmployeeDiscovery] Twitter found: ${twitterResults.length} people`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] Twitter error: ${e.message}`);
        }
    }

    // Method 9: npm/PyPI Package Maintainers for Tech Companies (FREE)
    if (employees.length < CONFIG.MAX_EMPLOYEES && (industry?.toLowerCase().includes('tech') || industry?.toLowerCase().includes('software') || industry?.toLowerCase().includes('saas'))) {
        console.log(`[EmployeeDiscovery] Method 9: Package registry search (npm/PyPI)...`);
        try {
            const packageResults = await searchPackageRegistries(companyName, domain);
            addUnique(employees, packageResults, seenEmails, seenNames);
            console.log(`[EmployeeDiscovery] Package registries found: ${packageResults.length} people`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] Package registry error: ${e.message}`);
        }
    }

    // Method 10: Press Releases & News (FREE)
    if (employees.length < CONFIG.MAX_EMPLOYEES) {
        console.log(`[EmployeeDiscovery] Method 10: News & press releases search...`);
        try {
            const newsResults = await searchNewsForEmployees(companyName, domain);
            addUnique(employees, newsResults, seenEmails, seenNames);
            console.log(`[EmployeeDiscovery] News search found: ${newsResults.length} people`);
        } catch (e) {
            console.log(`[EmployeeDiscovery] News search error: ${e.message}`);
        }
    }

    // Sort by confidence and relevance
    employees.sort((a, b) => {
        // Prioritize verified emails
        if (a.emailConfidence === 'verified' && b.emailConfidence !== 'verified') return -1;
        if (b.emailConfidence === 'verified' && a.emailConfidence !== 'verified') return 1;
        // Then by role relevance
        if (targetRole) {
            const aMatch = a.role?.toLowerCase().includes(targetRole.toLowerCase());
            const bMatch = b.role?.toLowerCase().includes(targetRole.toLowerCase());
            if (aMatch && !bMatch) return -1;
            if (bMatch && !aMatch) return 1;
        }
        return 0;
    });

    console.log(`\n[EmployeeDiscovery] ========================================`);
    console.log(`[EmployeeDiscovery] TOTAL: ${employees.length} employees found`);
    console.log(`[EmployeeDiscovery] ========================================\n`);

    return employees.slice(0, CONFIG.MAX_EMPLOYEES);
}

function addUnique(target, source, seenEmails, seenNames) {
    for (const emp of source) {
        if (target.length >= CONFIG.MAX_EMPLOYEES) break;

        const emailKey = emp.email?.toLowerCase();
        const nameKey = emp.name?.toLowerCase().trim();

        // Skip if we've seen this email or name
        if (emailKey && seenEmails.has(emailKey)) continue;
        if (nameKey && seenNames.has(nameKey)) continue;

        if (emailKey) seenEmails.add(emailKey);
        if (nameKey) seenNames.add(nameKey);

        target.push(emp);
        console.log(`[EmployeeDiscovery] ✓ Added: ${emp.name} - ${emp.role} (${emp.source})`);
    }
}

/**
 * AI-POWERED SEARCH: Uses Mistral AI to intelligently find employees
 * This is the primary and most powerful method
 */
async function searchWithMistralAI(companyName, domain, website, targetRole, apiKey) {
    const employees = [];
    console.log(`[EmployeeDiscovery] 🤖 Starting AI-powered research for ${companyName}...`);

    try {
        // Step 1: Gather raw data from multiple sources for AI to analyze
        const rawData = await gatherRawDataForAI(companyName, domain, website);

        if (!rawData || rawData.length < 50) {
            console.log(`[EmployeeDiscovery] Not enough data gathered for AI analysis`);
            return employees;
        }

        console.log(`[EmployeeDiscovery] 🤖 Gathered ${rawData.length} chars of data for AI analysis`);

        // Step 2: Send to Mistral AI for intelligent extraction
        const aiPrompt = `
Company: ${companyName}
Domain: ${domain}
Website: ${website || 'N/A'}
Target Role: ${targetRole || 'Any executive or employee'}

Raw data from web searches:
${rawData.slice(0, 8000)}

Based on this data, extract ALL real employees of ${companyName} that you can identify.
Focus on executives (CEO, CTO, CFO, Founders) but include other employees too.
Return ONLY valid JSON with employee names and roles.`;

        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: [
                    { role: 'system', content: EMPLOYEE_EXTRACTION_PROMPT },
                    { role: 'user', content: aiPrompt }
                ],
                temperature: 0.3,
                max_tokens: 2000,
                response_format: { type: 'json_object' }
            }),
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`[EmployeeDiscovery] Mistral API error: ${response.status} - ${errorText}`);
            return employees;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.log(`[EmployeeDiscovery] Empty AI response`);
            return employees;
        }

        console.log(`[EmployeeDiscovery] 🤖 AI Response received, parsing...`);

        // Step 3: Parse AI response
        const result = JSON.parse(content);
        const extractedEmployees = result.employees || result.people || [];

        for (const emp of extractedEmployees) {
            const name = emp.name?.trim();
            const role = emp.role || emp.title || emp.position || 'Employee';

            if (isValidName(name)) {
                employees.push({
                    id: uuidv4(),
                    name: name,
                    role: role,
                    email: generateEmail(name, domain),
                    emailConfidence: 'pattern',
                    linkedInUrl: generateLinkedInSearchUrl(...name.split(' ')),
                    department: getDepartment(role),
                    source: 'Mistral AI'
                });
                console.log(`[EmployeeDiscovery] 🤖 AI Found: ${name} - ${role}`);
            }
        }

        console.log(`[EmployeeDiscovery] 🤖 AI extracted ${employees.length} employees`);

    } catch (e) {
        console.log(`[EmployeeDiscovery] AI search error: ${e.message}`);
    }

    return employees;
}

/**
 * Gather raw data from multiple sources for AI to analyze
 */
async function gatherRawDataForAI(companyName, domain, website) {
    let rawData = '';

    // Source 1: DuckDuckGo search for company info and team
    const queries = [
        `"${companyName}" CEO founder CTO team leadership`,
        `"${companyName}" executives about team`,
        `site:linkedin.com "${companyName}" CEO OR founder OR CTO`
    ];

    for (const query of queries) {
        try {
            const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
                headers: {
                    'User-Agent': CONFIG.USER_AGENT,
                    'Accept': 'text/html'
                },
                signal: AbortSignal.timeout(10000)
            });

            if (response.ok) {
                const html = await response.text();
                // Extract visible text from search results
                const textContent = html
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .slice(0, 5000);
                rawData += textContent + '\n\n';
            }
            await delay(300);
        } catch { }
    }

    // Source 2: Company website about/team pages
    if (website) {
        const aboutPaths = ['/about', '/team', '/about-us', '/leadership'];
        const baseUrl = website.replace(/\/$/, '');

        for (const path of aboutPaths) {
            try {
                const response = await fetch(`${baseUrl}${path}`, {
                    headers: { 'User-Agent': CONFIG.USER_AGENT },
                    signal: AbortSignal.timeout(8000),
                    redirect: 'follow'
                });

                if (response.ok) {
                    const html = await response.text();
                    const textContent = html
                        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .slice(0, 4000);
                    rawData += `\n[From ${baseUrl}${path}]\n${textContent}\n\n`;
                }
                await delay(200);
            } catch { }
        }
    }

    return rawData;
}

// ============ SEARCH METHODS ============

/**
 * Method 3: Dedicated Executive Search (FREE - PRIORITY) 
 * Specifically searches for CEO, Founders, CTO, C-Suite executives
 * Every company has leadership - this method focuses on finding them
 */
async function searchExecutives(companyName, domain, website) {
    const employees = [];
    console.log(`[EmployeeDiscovery] Searching for executives of ${companyName}...`);

    // Strategy 1: Direct search for "CEO of [company]", "founder of [company]"
    const executiveQueries = [
        `"${companyName}" CEO`,
        `"${companyName}" founder`,
        `"${companyName}" CTO`,
        `"${companyName}" CFO`,
        `site:linkedin.com/in "${companyName}" CEO OR founder OR CTO`
    ];

    for (const query of executiveQueries) {
        if (employees.length >= 5) break;

        try {
            const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

            const response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': CONFIG.USER_AGENT,
                    'Accept': 'text/html'
                },
                signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
            });

            if (!response.ok) continue;
            const html = await response.text();

            // Pattern 1: "Name, CEO of Company" or "Name is the CEO"
            const patterns = [
                /([A-Z][a-z]{2,15}\s+[A-Z][a-z]{2,15}(?:\s+[A-Z][a-z]{2,15})?),?\s+(?:is\s+)?(?:the\s+)?(?:CEO|CTO|CFO|COO|Founder|Co-Founder|Managing\s+Director|President)\s+(?:of|at)\s+/gi,
                /(?:CEO|CTO|CFO|COO|Founder|President)\s+([A-Z][a-z]{2,15}\s+[A-Z][a-z]{2,15})(?:\s+(?:at|of|,|said|announced))/gi,
                /(?:led\s+by|headed\s+by|founded\s+by)\s+([A-Z][a-z]{2,15}\s+[A-Z][a-z]{2,15})/gi
            ];

            for (const pattern of patterns) {
                let match;
                while ((match = pattern.exec(html)) !== null && employees.length < 8) {
                    const name = match[1]?.trim();

                    if (isValidName(name)) {
                        const roleMatch = match[0].match(/CEO|CTO|CFO|COO|Founder|Co-Founder|Managing\s+Director|President/i);
                        const role = roleMatch ? roleMatch[0] : 'Executive';

                        // Check for duplicates
                        const isDuplicate = employees.some(e =>
                            e.name.toLowerCase() === name.toLowerCase()
                        );

                        if (!isDuplicate) {
                            employees.push({
                                id: uuidv4(),
                                name: name,
                                role: role,
                                email: generateEmail(name, domain),
                                emailConfidence: 'pattern',
                                linkedInUrl: generateLinkedInSearchUrl(...name.split(' ')),
                                department: 'Executive',
                                source: 'Executive Search'
                            });
                            console.log(`[EmployeeDiscovery] Found executive: ${name} - ${role}`);
                        }
                    }
                }
            }

            await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
        } catch (e) {
            console.log(`[EmployeeDiscovery] Executive search query error: ${e.message}`);
        }
    }

    // Strategy 2: Search company's About/Leadership page directly
    if (employees.length < 3 && website) {
        try {
            const aboutPaths = ['/about', '/about-us', '/team', '/leadership', '/our-team', '/company'];
            const baseUrl = website.replace(/\/$/, '');

            for (const path of aboutPaths) {
                if (employees.length >= 5) break;

                try {
                    const response = await fetch(`${baseUrl}${path}`, {
                        headers: { 'User-Agent': CONFIG.USER_AGENT },
                        signal: AbortSignal.timeout(10000),
                        redirect: 'follow'
                    });

                    if (!response.ok) continue;
                    const html = await response.text();

                    // Look for JSON-LD data (structured data)
                    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
                    if (jsonLdMatch) {
                        for (const jsonScript of jsonLdMatch) {
                            try {
                                const jsonContent = jsonScript.replace(/<\/?script[^>]*>/gi, '');
                                const data = JSON.parse(jsonContent);

                                // Look for Person type or founder/employee arrays
                                const people = data.founder || data.employee || data.member || [];
                                const peopleArray = Array.isArray(people) ? people : [people];

                                for (const person of peopleArray) {
                                    if (person && person.name && typeof person.name === 'string') {
                                        const name = person.name.trim();
                                        const role = person.jobTitle || person.title || 'Founder';

                                        if (isValidName(name)) {
                                            const isDuplicate = employees.some(e =>
                                                e.name.toLowerCase() === name.toLowerCase()
                                            );

                                            if (!isDuplicate) {
                                                employees.push({
                                                    id: uuidv4(),
                                                    name: name,
                                                    role: role,
                                                    email: generateEmail(name, domain),
                                                    emailConfidence: 'pattern',
                                                    linkedInUrl: generateLinkedInSearchUrl(...name.split(' ')),
                                                    department: getDepartment(role),
                                                    source: 'Company Website (Structured)'
                                                });
                                                console.log(`[EmployeeDiscovery] Found from structured data: ${name} - ${role}`);
                                            }
                                        }
                                    }
                                }
                            } catch { }
                        }
                    }

                    // Look for common patterns in About/Team pages
                    // Pattern: <h2>Name</h2> followed by <p>Title</p>
                    const teamCardPattern = /<(?:h[2-4]|div|span)[^>]*class="[^"]*(?:name|title|person-name|team-name)[^"]*"[^>]*>([A-Z][a-z]{2,15}\s+[A-Z][a-z]{2,15}(?:\s+[A-Z][a-z]{2,15})?)<\/(?:h[2-4]|div|span)>[\s\S]{0,200}?<(?:p|span|div)[^>]*>([^<]{3,60})<\/(?:p|span|div)>/gi;

                    let cardMatch;
                    while ((cardMatch = teamCardPattern.exec(html)) !== null && employees.length < 8) {
                        const name = cardMatch[1].replace(/<[^>]*>/g, '').trim();
                        const role = cardMatch[2].replace(/<[^>]*>/g, '').trim();

                        if (isValidName(name) && role.length > 2) {
                            const isDuplicate = employees.some(e =>
                                e.name.toLowerCase() === name.toLowerCase()
                            );

                            if (!isDuplicate) {
                                employees.push({
                                    id: uuidv4(),
                                    name: name,
                                    role: role,
                                    email: generateEmail(name, domain),
                                    emailConfidence: 'pattern',
                                    linkedInUrl: generateLinkedInSearchUrl(...name.split(' ')),
                                    department: getDepartment(role),
                                    source: 'Company Website'
                                });
                            }
                        }
                    }
                } catch { }
            }
        } catch (e) {
            console.log(`[EmployeeDiscovery] Website executive search error: ${e.message}`);
        }
    }

    // Strategy 3: Search Crunchbase/AngelList for founders
    if (employees.length < 3) {
        try {
            const searchUrl = `https://html.duckduckgo.com/html/?q=site:crunchbase.com+OR+site:angel.co+OR+site:wellfound.com+"${companyName}"`;

            const response = await fetch(searchUrl, {
                headers: { 'User-Agent': CONFIG.USER_AGENT },
                signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
            });

            if (response.ok) {
                const html = await response.text();

                // Extract person slugs from Crunchbase
                const personPattern = /crunchbase\.com\/person\/([a-z\-]+)/gi;
                let personMatch;

                while ((personMatch = personPattern.exec(html)) !== null && employees.length < 8) {
                    const slug = personMatch[1];
                    // Convert slug to name: john-smith -> John Smith
                    const name = slug.split('-')
                        .filter(w => w.length > 1)
                        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');

                    if (isValidName(name)) {
                        const isDuplicate = employees.some(e =>
                            e.name.toLowerCase() === name.toLowerCase()
                        );

                        if (!isDuplicate) {
                            employees.push({
                                id: uuidv4(),
                                name: name,
                                role: 'Founder/Executive',
                                email: generateEmail(name, domain),
                                emailConfidence: 'pattern',
                                linkedInUrl: generateLinkedInSearchUrl(...name.split(' ')),
                                department: 'Executive',
                                source: 'Crunchbase',
                                profileUrl: `https://www.crunchbase.com/person/${slug}`
                            });
                            console.log(`[EmployeeDiscovery] Found from Crunchbase: ${name}`);
                        }
                    }
                }
            }
        } catch (e) {
            console.log(`[EmployeeDiscovery] Crunchbase executive search error: ${e.message}`);
        }
    }

    console.log(`[EmployeeDiscovery] Executive search total: ${employees.length} executives found`);
    return employees;
}

/**
 * Method 1: Hunter.io Domain Search API (optional - needs API key)
 */
async function searchHunterIO(domain, apiKey) {
    const employees = [];
    try {
        const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}&limit=10`;
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
        });

        if (!response.ok) return employees;
        const data = await response.json();

        if (data.data?.emails) {
            for (const contact of data.data.emails) {
                if (!contact.first_name || !contact.last_name) continue;
                employees.push({
                    id: uuidv4(),
                    name: `${contact.first_name} ${contact.last_name}`,
                    role: contact.position || contact.department || 'Employee',
                    email: contact.value,
                    emailConfidence: contact.confidence > 90 ? 'verified' : contact.confidence > 50 ? 'likely' : 'pattern',
                    linkedInUrl: contact.linkedin || generateLinkedInSearchUrl(contact.first_name, contact.last_name),
                    department: contact.department || getDepartment(contact.position),
                    source: 'Hunter.io (Verified)'
                });
            }
        }
    } catch (e) {
        console.log(`[EmployeeDiscovery] Hunter.io error: ${e.message}`);
    }
    return employees;
}

/**
 * Method 2: Apollo.io People Search API (optional - needs API key)
 */
async function searchApollo(companyName, domain, apiKey) {
    const employees = [];
    try {
        const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
                employees.push({
                    id: uuidv4(),
                    name: `${person.first_name} ${person.last_name}`,
                    role: person.title || 'Employee',
                    email: person.email || generateEmail(person.first_name + ' ' + person.last_name, domain),
                    emailConfidence: person.email ? 'verified' : 'pattern',
                    linkedInUrl: person.linkedin_url || generateLinkedInSearchUrl(person.first_name, person.last_name),
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
 * Method 3: GitHub Organization Members (FREE - no API key needed)
 */
async function searchGitHub(companyName, domain) {
    const employees = [];

    const orgNames = [
        companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        companyName.toLowerCase().replace(/\s+/g, ''),
        domain.split('.')[0],
        companyName.toLowerCase().replace(/\s+/g, '_')
    ];

    for (const orgName of orgNames) {
        if (employees.length >= 5) break;

        try {
            // Get org members
            const response = await fetch(`https://api.github.com/orgs/${orgName}/members?per_page=10`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'EmployeeDiscovery/1.0'
                },
                signal: AbortSignal.timeout(8000)
            });

            if (!response.ok) continue;
            const members = await response.json();

            for (const member of members.slice(0, 5)) {
                await delay(200);

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
                        role: user.bio?.slice(0, 60) || 'Developer',
                        email: user.email || generateEmail(user.name, domain),
                        emailConfidence: user.email ? 'verified' : 'pattern',
                        linkedInUrl: generateLinkedInSearchUrl(...user.name.split(' ')),
                        department: 'Technology',
                        source: 'GitHub',
                        profileUrl: user.html_url
                    });
                }
            }

            if (members.length > 0) break;
        } catch { }
    }

    return employees;
}

/**
 * Method 4: LinkedIn Search via DuckDuckGo (FREE)
 */
async function searchLinkedInViaDuckDuckGo(companyName, domain, targetRole) {
    const employees = [];

    try {
        // Search for LinkedIn profiles of company employees
        const roleQuery = targetRole ? `${targetRole} ` : '';
        const query = `site:linkedin.com/in "${companyName}" ${roleQuery}employee`;

        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': CONFIG.USER_AGENT,
                'Accept': 'text/html'
            },
            signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
        });

        if (!response.ok) return employees;
        const html = await response.text();

        // Extract LinkedIn profile URLs and names
        const linkedInPattern = /https?:\/\/(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-]+)/gi;
        const titlePattern = /<a[^>]*class="result__a"[^>]*>([^<]+)<\/a>/gi;

        const matches = [...html.matchAll(linkedInPattern)];
        const titleMatches = [...html.matchAll(titlePattern)];

        for (let i = 0; i < Math.min(matches.length, 8); i++) {
            const linkedInUrl = matches[i][0];
            const username = matches[i][1];

            // Try to extract name from title
            let name = '';
            let role = '';

            if (titleMatches[i]) {
                const titleText = titleMatches[i][1].replace(/<[^>]*>/g, '').trim();
                // LinkedIn titles are usually "Name - Title - Company | LinkedIn"
                const parts = titleText.split(/\s*[-|–]\s*/);
                if (parts.length > 0) {
                    name = parts[0].trim();
                }
                if (parts.length > 1) {
                    role = parts[1].trim();
                }
            }

            // Fallback: Convert username to name
            if (!name || name.length < 3) {
                name = username.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }

            if (isValidName(name)) {
                employees.push({
                    id: uuidv4(),
                    name: name,
                    role: role || 'Employee',
                    email: generateEmail(name, domain),
                    emailConfidence: 'pattern',
                    linkedInUrl: linkedInUrl,
                    department: getDepartment(role),
                    source: 'LinkedIn Search'
                });
            }
        }
    } catch (e) {
        console.log(`[EmployeeDiscovery] LinkedIn DuckDuckGo error: ${e.message}`);
    }

    return employees;
}

/**
 * Method 5: Google Search for Company Employees (FREE via DuckDuckGo)
 */
async function searchGoogleForEmployees(companyName, domain, targetRole) {
    const employees = [];

    const queries = [
        `"${companyName}" "team" OR "about us" OR "leadership" OR "our team"`,
        `"${companyName}" ${targetRole || 'CEO OR CTO OR founder'} email`,
        `"@${domain}" founder OR CEO OR CTO OR engineer`
    ];

    for (const query of queries) {
        if (employees.length >= 6) break;

        try {
            const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

            const response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': CONFIG.USER_AGENT,
                    'Accept': 'text/html'
                },
                signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
            });

            if (!response.ok) continue;
            const html = await response.text();

            // Extract email addresses
            const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
            const emails = [...html.matchAll(emailPattern)];

            for (const match of emails) {
                const email = match[0].toLowerCase();

                // Only include emails from the company domain
                if (email.includes(domain) && !email.includes('example') && !email.includes('noreply') && !email.includes('info@') && !email.includes('contact@') && !email.includes('support@')) {
                    const namePart = email.split('@')[0];
                    const nameParts = namePart.split(/[._-]/).filter(p => p.length > 1);

                    if (nameParts.length >= 2) {
                        const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
                        const lastName = nameParts[nameParts.length - 1].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].slice(1);

                        employees.push({
                            id: uuidv4(),
                            name: `${firstName} ${lastName}`,
                            role: targetRole || 'Employee',
                            email: email,
                            emailConfidence: 'likely',
                            linkedInUrl: generateLinkedInSearchUrl(firstName, lastName),
                            department: getDepartment(targetRole),
                            source: 'Web Search'
                        });
                    }
                }
            }

            await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
        } catch { }
    }

    return employees;
}

/**
 * Method 6: Company Website Deep Scraping (FREE)
 */
async function scrapeWebsite(companyName, domain, website) {
    const employees = [];

    const paths = [
        '/about', '/team', '/about-us', '/leadership', '/people',
        '/our-team', '/management', '/executives', '/founders',
        '/about/team', '/company/team', '/company/leadership'
    ];

    const baseUrl = website?.replace(/\/$/, '') || `https://${domain}`;

    for (const path of paths) {
        if (employees.length >= 8) break;

        try {
            const response = await fetch(`${baseUrl}${path}`, {
                headers: {
                    'User-Agent': CONFIG.USER_AGENT,
                    'Accept': 'text/html'
                },
                signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT),
                redirect: 'follow'
            });

            if (!response.ok) continue;
            const html = await response.text();

            // Method A: Extract JSON-LD structured data
            const jsonLdPattern = /"@type"\s*:\s*"Person"[^}]*"name"\s*:\s*"([^"]+)"[^}]*"jobTitle"\s*:\s*"([^"]+)"/gi;
            let match;
            while ((match = jsonLdPattern.exec(html)) !== null && employees.length < 8) {
                const name = match[1];
                const role = match[2];

                if (isValidName(name)) {
                    employees.push({
                        id: uuidv4(),
                        name,
                        role: role.slice(0, 60),
                        email: generateEmail(name, domain),
                        emailConfidence: 'pattern',
                        linkedInUrl: generateLinkedInSearchUrl(...name.split(' ')),
                        department: getDepartment(role),
                        source: 'Company Website'
                    });
                }
            }

            // Method B: Look for common team card patterns
            const teamPatterns = [
                // Pattern: <h3>Name</h3><p>Title</p>
                /<h[2-4][^>]*>([^<]{3,40})<\/h[2-4]>\s*<[^>]*>([A-Z][^<]{3,60})<\//gi,
                // Pattern: class="name">Name</...><...class="title">Title<
                /class="[^"]*name[^"]*"[^>]*>([^<]{3,40})<\/[^>]+>\s*<[^>]*class="[^"]*(?:title|role|position)[^"]*"[^>]*>([^<]{3,60})</gi,
                // Pattern: <img alt="Name ..."><...>Title<
                /<img[^>]*alt="([A-Z][^"]{2,35})"[^>]*>[^<]*<[^>]*>([A-Z][^<]{3,60})</gi
            ];

            for (const pattern of teamPatterns) {
                let teamMatch;
                while ((teamMatch = pattern.exec(html)) !== null && employees.length < 8) {
                    const name = teamMatch[1].replace(/<[^>]*>/g, '').trim();
                    const role = teamMatch[2].replace(/<[^>]*>/g, '').trim();

                    if (isValidName(name) && role.length > 2 && role.length < 80) {
                        employees.push({
                            id: uuidv4(),
                            name,
                            role: role.slice(0, 60),
                            email: generateEmail(name, domain),
                            emailConfidence: 'pattern',
                            linkedInUrl: generateLinkedInSearchUrl(...name.split(' ')),
                            department: getDepartment(role),
                            source: 'Company Website'
                        });
                    }
                }
            }

            // Method C: Look for email addresses in the page
            const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*domain-placeholder[a-zA-Z0-9.-]*/gi;
            const domainEscaped = domain.replace(/\./g, '\\.');
            const domainEmailPattern = new RegExp(`[a-zA-Z0-9._%+-]+@${domainEscaped}`, 'gi');

            const domainEmails = html.match(domainEmailPattern) || [];
            for (const email of domainEmails.slice(0, 5)) {
                const cleanEmail = email.toLowerCase();
                if (cleanEmail.includes('info@') || cleanEmail.includes('contact@') || cleanEmail.includes('support@') || cleanEmail.includes('hello@')) continue;

                const namePart = cleanEmail.split('@')[0];
                const parts = namePart.split(/[._-]/).filter(p => p.length > 1);

                if (parts.length >= 2) {
                    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
                    const lastName = parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1);

                    employees.push({
                        id: uuidv4(),
                        name: `${firstName} ${lastName}`,
                        role: 'Employee',
                        email: cleanEmail,
                        emailConfidence: 'likely',
                        linkedInUrl: generateLinkedInSearchUrl(firstName, lastName),
                        department: 'General',
                        source: 'Company Website'
                    });
                }
            }

            await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
        } catch { }
    }

    return employees;
}

/**
 * Method 7: Crunchbase Public Data (FREE)
 */
async function searchCrunchbase(companyName, domain) {
    const employees = [];

    try {
        // Search for company on Crunchbase via DuckDuckGo
        const query = `site:crunchbase.com "${companyName}" people founder CEO`;
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': CONFIG.USER_AGENT,
                'Accept': 'text/html'
            },
            signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
        });

        if (!response.ok) return employees;
        const html = await response.text();

        // Extract people from Crunchbase URLs
        const crunchbasePattern = /crunchbase\.com\/person\/([a-zA-Z0-9\-]+)/gi;
        const matches = [...html.matchAll(crunchbasePattern)];

        for (const match of matches.slice(0, 5)) {
            const personSlug = match[1];
            const name = personSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            if (isValidName(name)) {
                employees.push({
                    id: uuidv4(),
                    name: name,
                    role: 'Executive',
                    email: generateEmail(name, domain),
                    emailConfidence: 'pattern',
                    linkedInUrl: generateLinkedInSearchUrl(...name.split(' ')),
                    department: 'Executive',
                    source: 'Crunchbase',
                    profileUrl: `https://www.crunchbase.com/person/${personSlug}`
                });
            }
        }
    } catch (e) {
        console.log(`[EmployeeDiscovery] Crunchbase error: ${e.message}`);
    }

    return employees;
}

/**
 * Method 8: Twitter/X Search (FREE via DuckDuckGo)
 */
async function searchTwitter(companyName, domain) {
    const employees = [];

    try {
        const query = `site:twitter.com "${companyName}" OR site:x.com "${companyName}" employee founder CEO`;
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': CONFIG.USER_AGENT,
                'Accept': 'text/html'
            },
            signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
        });

        if (!response.ok) return employees;
        const html = await response.text();

        // Extract Twitter profile information from search results
        const twitterPattern = /(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/gi;
        const titlePattern = /<a[^>]*class="result__a"[^>]*>([^<]+)<\/a>/gi;

        const matches = [...html.matchAll(twitterPattern)];
        const titles = [...html.matchAll(titlePattern)];

        const seenUsernames = new Set(['twitter', 'x', 'home', 'search', 'explore', 'settings', 'intent']);

        for (let i = 0; i < Math.min(matches.length, titles.length, 5); i++) {
            const username = matches[i][1].toLowerCase();
            if (seenUsernames.has(username)) continue;
            seenUsernames.add(username);

            const titleText = titles[i]?.[1]?.replace(/<[^>]*>/g, '').trim() || '';

            // Try to extract name from title (usually "Name (@username)")
            const nameMatch = titleText.match(/^([A-Z][a-zA-Z]+ [A-Z][a-zA-Z]+)/);
            const name = nameMatch ? nameMatch[1] : username.split(/[_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            if (isValidName(name)) {
                employees.push({
                    id: uuidv4(),
                    name: name,
                    role: 'Employee',
                    email: generateEmail(name, domain),
                    emailConfidence: 'pattern',
                    linkedInUrl: generateLinkedInSearchUrl(...name.split(' ')),
                    department: 'General',
                    source: 'Twitter/X',
                    twitterUrl: `https://twitter.com/${username}`
                });
            }
        }
    } catch (e) {
        console.log(`[EmployeeDiscovery] Twitter error: ${e.message}`);
    }

    return employees;
}

/**
 * Method 9: npm/PyPI Package Maintainers (FREE)
 */
async function searchPackageRegistries(companyName, domain) {
    const employees = [];

    try {
        // Search npm for packages by company
        const searchTerms = [
            companyName.toLowerCase().replace(/\s+/g, '-'),
            domain.split('.')[0]
        ];

        for (const term of searchTerms) {
            if (employees.length >= 3) break;

            try {
                const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=maintainer:${term}&size=5`, {
                    headers: { 'Accept': 'application/json' },
                    signal: AbortSignal.timeout(8000)
                });

                if (!response.ok) continue;
                const data = await response.json();

                if (data.objects) {
                    for (const pkg of data.objects) {
                        const maintainer = pkg.package?.maintainers?.[0];
                        if (maintainer?.name && maintainer?.email) {
                            if (maintainer.email.includes(domain) || maintainer.name.split(' ').length >= 2) {
                                employees.push({
                                    id: uuidv4(),
                                    name: maintainer.name,
                                    role: 'Developer',
                                    email: maintainer.email,
                                    emailConfidence: 'verified',
                                    linkedInUrl: generateLinkedInSearchUrl(...maintainer.name.split(' ')),
                                    department: 'Technology',
                                    source: 'npm Registry'
                                });
                            }
                        }
                    }
                }
            } catch { }
        }
    } catch (e) {
        console.log(`[EmployeeDiscovery] Package registry error: ${e.message}`);
    }

    return employees;
}

/**
 * Method 10: News & Press Releases (FREE)
 */
async function searchNewsForEmployees(companyName, domain) {
    const employees = [];

    try {
        const queries = [
            `"${companyName}" CEO OR founder OR CTO announcement`,
            `"${companyName}" hired OR appoints OR names`
        ];

        for (const query of queries) {
            if (employees.length >= 4) break;

            try {
                const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

                const response = await fetch(searchUrl, {
                    headers: {
                        'User-Agent': CONFIG.USER_AGENT,
                        'Accept': 'text/html'
                    },
                    signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
                });

                if (!response.ok) continue;
                const html = await response.text();

                // Look for patterns like "John Smith, CEO of Company"
                // Pattern requires proper names (at least 3 chars each part, no keywords)
                const executivePatterns = [
                    /([A-Z][a-z]{2,15} [A-Z][a-z]{2,15}),?\s+(?:is\s+)?(?:the\s+)?(?:CEO|CTO|CFO|COO|Founder|Co-Founder|President|VP|Director|Head)\s+(?:of|at)?\s*(?:the\s+)?/gi,
                    /(?:CEO|CTO|CFO|COO|Founder|President)\s+([A-Z][a-z]{2,15} [A-Z][a-z]{2,15})(?:\s|,|$)/gi,
                    /(?:appointed|hired|named|announces)\s+([A-Z][a-z]{2,15} [A-Z][a-z]{2,15})\s+(?:as\s+)?(?:CEO|CTO|CFO|COO|Founder|President|Director)/gi
                ];

                for (const pattern of executivePatterns) {
                    let match;
                    while ((match = pattern.exec(html)) !== null && employees.length < 8) {
                        const name = match[1]?.trim();

                        if (isValidName(name)) {
                            // Extract role from match
                            const roleMatch = match[0].match(/CEO|CTO|CFO|COO|Founder|Co-Founder|President|VP|Director|Head/i);
                            const role = roleMatch ? roleMatch[0] : 'Executive';

                            employees.push({
                                id: uuidv4(),
                                name: name,
                                role: role,
                                email: generateEmail(name, domain),
                                emailConfidence: 'pattern',
                                linkedInUrl: generateLinkedInSearchUrl(...name.split(' ')),
                                department: 'Executive',
                                source: 'News/Press'
                            });
                        }
                    }
                }

                await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
            } catch { }
        }
    } catch (e) {
        console.log(`[EmployeeDiscovery] News search error: ${e.message}`);
    }

    return employees;
}

// ============ HELPER FUNCTIONS ============

function isValidName(name) {
    if (!name || typeof name !== 'string') return false;
    const cleanName = name.trim();
    const nameLower = cleanName.toLowerCase();
    const parts = cleanName.split(/\s+/);
    if (parts.length < 2 || parts.length > 4) return false;
    if (cleanName.length < 7 || cleanName.length > 50) return false;  // Min 7 chars (e.g. "Jo Lee")

    // CRITICAL: Block fake/placeholder names that AI might generate
    const fakeNames = [
        'john smith', 'jane doe', 'john doe', 'jane smith',
        'test user', 'sample name', 'example name', 'placeholder',
        'first last', 'your name', 'full name', 'real name',
        'bob smith', 'alice johnson', 'mike johnson', 'sarah williams',
        'real_name_from_data', 'actual_title', 'ceo name', 'cto name'
    ];
    if (fakeNames.some(fake => nameLower === fake || nameLower.includes(fake))) return false;

    // Block common non-names, keywords, and company patterns
    const blocked = [
        'job', 'career', 'hiring', 'team', 'company', 'seekers', 'employee', 'contact',
        'about', 'home', 'page', 'privacy', 'terms', 'login', 'sign', 'register',
        'ceo or', 'cto or', 'cfo or', 'founder or', 'president or',  // Query artifacts
        'the ', 'and ', 'for ', 'with ', 'from ',  // Common phrases
        // Company/Organization patterns
        'fund', 'capital', 'ventures', 'partners', 'group', 'holdings', 'investment',
        'solutions', 'technologies', 'services', 'consulting', 'agency', 'studio',
        'labs', 'works', 'systems', 'software', 'digital', 'media', 'global',
        'international', 'associates', 'advisors', 'llc', 'inc', 'ltd', 'corp',
        'foundation', 'institute', 'academy', 'university', 'college'
    ];
    if (blocked.some(b => nameLower.includes(b))) return false;

    // Block specific known company names often mistaken as people
    const companyNames = [
        'founders fund', 'a16z', 'andreessen horowitz', 'sequoia capital',
        'venture partners', 'angel investor', 'seed round', 'series a'
    ];
    if (companyNames.some(c => nameLower.includes(c))) return false;

    // Block if any part is too short (less than 2 chars) or is a keyword
    const shortWords = ['or', 'and', 'the', 'of', 'at', 'in', 'to', 'for', 'is', 'a', 'an', 'llp', 'plc'];
    for (const part of parts) {
        if (part.length < 2) return false;
        if (shortWords.includes(part.toLowerCase())) return false;
    }

    // Each part should start with a capital letter and have at least 1 lowercase after
    for (const part of parts) {
        if (!/^[A-Z][a-z]{1,}/.test(part)) return false;
    }

    return true;
}

function generateEmail(name, domain) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.toLowerCase().replace(/[^a-z]/g, '') || 'contact';
    const last = parts[parts.length - 1]?.toLowerCase().replace(/[^a-z]/g, '') || '';
    return `${first}.${last}@${domain}`;
}

function generateLinkedInSearchUrl(firstName, lastName) {
    const searchName = `${firstName || ''} ${lastName || ''}`.trim();
    return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchName)}`;
}

function getDepartment(role) {
    const r = (role || '').toLowerCase();
    if (/ceo|founder|president|chief executive/i.test(r)) return 'Executive';
    if (/cto|engineer|developer|tech|software|devops/i.test(r)) return 'Technology';
    if (/cmo|marketing|growth|brand|content/i.test(r)) return 'Marketing';
    if (/sales|business development|account/i.test(r)) return 'Sales';
    if (/coo|operations|logistics/i.test(r)) return 'Operations';
    if (/cfo|finance|accounting/i.test(r)) return 'Finance';
    if (/hr|people|talent|recruiting/i.test(r)) return 'Human Resources';
    if (/product|pm/i.test(r)) return 'Product';
    if (/design|ux|ui|creative/i.test(r)) return 'Design';
    if (/legal|counsel|compliance/i.test(r)) return 'Legal';
    return 'General';
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default { discoverEmployees };
