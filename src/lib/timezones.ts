// Comprehensive list of all world timezones organized by region
export const ALL_TIMEZONES = [
    // UTC
    'UTC',

    // Africa
    'Africa/Abidjan',
    'Africa/Accra',
    'Africa/Addis_Ababa',
    'Africa/Algiers',
    'Africa/Cairo',
    'Africa/Casablanca',
    'Africa/Johannesburg',
    'Africa/Lagos',
    'Africa/Nairobi',
    'Africa/Tunis',

    // America - North
    'America/Anchorage',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Mexico_City',
    'America/New_York',
    'America/Phoenix',
    'America/Toronto',
    'America/Vancouver',

    // America - Central
    'America/Belize',
    'America/Costa_Rica',
    'America/El_Salvador',
    'America/Guatemala',
    'America/Havana',
    'America/Jamaica',
    'America/Panama',

    // America - South
    'America/Argentina/Buenos_Aires',
    'America/Bogota',
    'America/Caracas',
    'America/Lima',
    'America/Santiago',
    'America/Sao_Paulo',

    // Asia - Middle East
    'Asia/Amman',
    'Asia/Baghdad',
    'Asia/Beirut',
    'Asia/Damascus',
    'Asia/Dubai',
    'Asia/Jerusalem',
    'Asia/Kuwait',
    'Asia/Muscat',
    'Asia/Qatar',
    'Asia/Riyadh',
    'Asia/Tehran',

    // Asia - Central
    'Asia/Almaty',
    'Asia/Ashgabat',
    'Asia/Baku',
    'Asia/Bishkek',
    'Asia/Dushanbe',
    'Asia/Karachi',
    'Asia/Kolkata',      // India
    'Asia/Tashkent',
    'Asia/Yerevan',

    // Asia - East
    'Asia/Bangkok',
    'Asia/Chongqing',
    'Asia/Hong_Kong',
    'Asia/Jakarta',
    'Asia/Kuala_Lumpur',
    'Asia/Manila',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Asia/Taipei',
    'Asia/Tokyo',
    'Asia/Yangon',

    // Australia & Pacific
    'Australia/Adelaide',
    'Australia/Brisbane',
    'Australia/Melbourne',
    'Australia/Perth',
    'Australia/Sydney',
    'Pacific/Auckland',
    'Pacific/Fiji',
    'Pacific/Guam',
    'Pacific/Honolulu',
    'Pacific/Pago_Pago',

    // Europe - West
    'Europe/Dublin',
    'Europe/Lisbon',
    'Europe/London',

    // Europe - Central
    'Europe/Amsterdam',
    'Europe/Berlin',
    'Europe/Brussels',
    'Europe/Copenhagen',
    'Europe/Madrid',
    'Europe/Paris',
    'Europe/Prague',
    'Europe/Rome',
    'Europe/Stockholm',
    'Europe/Vienna',
    'Europe/Warsaw',
    'Europe/Zurich',

    // Europe - East
    'Europe/Athens',
    'Europe/Bucharest',
    'Europe/Helsinki',
    'Europe/Istanbul',
    'Europe/Kiev',
    'Europe/Minsk',
    'Europe/Moscow',
    'Europe/Riga',
    'Europe/Sofia',
    'Europe/Tallinn',
    'Europe/Vilnius',
];

// Helper function to format timezone for display
export const formatTimezone = (tz: string): string => {
    // Convert "America/New_York" to "America - New York"
    const parts = tz.split('/');
    if (parts.length === 1) return tz; // UTC

    const region = parts[0];
    const city = parts.slice(1).join('/').replace(/_/g, ' ');

    return `${region} - ${city}`;
};

// Helper function to get timezone offset
export const getTimezoneOffset = (tz: string): string => {
    try {
        const now = new Date();
        const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
        const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
        const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);

        const sign = offset >= 0 ? '+' : '';
        return `UTC${sign}${offset}`;
    } catch {
        return '';
    }
};

// Group timezones by region for better organization
export const TIMEZONE_GROUPS = {
    'UTC': ['UTC'],
    'Africa': ALL_TIMEZONES.filter(tz => tz.startsWith('Africa/')),
    'America': ALL_TIMEZONES.filter(tz => tz.startsWith('America/')),
    'Asia': ALL_TIMEZONES.filter(tz => tz.startsWith('Asia/')),
    'Australia & Pacific': ALL_TIMEZONES.filter(tz => tz.startsWith('Australia/') || tz.startsWith('Pacific/')),
    'Europe': ALL_TIMEZONES.filter(tz => tz.startsWith('Europe/')),
};

// Popular timezones for quick access
export const POPULAR_TIMEZONES = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Paris',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
];
