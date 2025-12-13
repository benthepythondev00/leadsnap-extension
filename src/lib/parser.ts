import type { CreateLeadInput } from '../types/lead';

/**
 * Email regex pattern
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Phone regex patterns (various formats)
 */
const PHONE_REGEX = /(?:\+?1[-.\s]?)?(?:\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;

/**
 * LinkedIn profile URL pattern
 */
const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/gi;

/**
 * Website URL pattern
 */
const URL_REGEX = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

/**
 * Extract email from text
 */
export function extractEmail(text: string): string | null {
  const matches = text.match(EMAIL_REGEX);
  return matches ? matches[0] : null;
}

/**
 * Extract phone number from text
 */
export function extractPhone(text: string): string | null {
  const matches = text.match(PHONE_REGEX);
  if (!matches) return null;
  
  // Clean up the phone number
  return matches[0].replace(/[-.\s()]/g, '').replace(/^1/, '+1');
}

/**
 * Extract LinkedIn URL from text
 */
export function extractLinkedIn(text: string): string | null {
  const matches = text.match(LINKEDIN_REGEX);
  if (!matches) return null;
  
  let url = matches[0];
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }
  return url;
}

/**
 * Extract website URL from text (excluding LinkedIn)
 */
export function extractWebsite(text: string): string | null {
  const matches = text.match(URL_REGEX);
  if (!matches) return null;
  
  // Filter out LinkedIn URLs and return the first non-LinkedIn URL
  const nonLinkedIn = matches.filter(url => !url.toLowerCase().includes('linkedin.com'));
  return nonLinkedIn[0] || null;
}

/**
 * Extract potential name from text
 * This is a heuristic approach - looks for capitalized words at the beginning
 */
export function extractName(text: string): string {
  // Remove URLs, emails, and phone numbers first
  let cleaned = text
    .replace(URL_REGEX, '')
    .replace(EMAIL_REGEX, '')
    .replace(PHONE_REGEX, '')
    .trim();
  
  // Split into lines and take the first non-empty line
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return text.substring(0, 50).trim();
  
  const firstLine = lines[0];
  
  // Look for a pattern like "Name: John Doe" or "Name - John Doe"
  const namePattern = /^(?:name|contact|person|from|by)[\s:|-]+(.+)/i;
  const nameMatch = firstLine.match(namePattern);
  if (nameMatch) {
    return nameMatch[1].trim().substring(0, 100);
  }
  
  // Look for capitalized words (potential names)
  const capitalizedWords = firstLine.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/);
  if (capitalizedWords && capitalizedWords[0].length > 2) {
    return capitalizedWords[0].substring(0, 100);
  }
  
  // Fallback: use first 50 chars of first line
  return firstLine.substring(0, 50).trim() || 'Unnamed Lead';
}

/**
 * Extract company name from text or URL
 */
export function extractCompany(text: string, url?: string): string {
  // Try to extract from text patterns like "Company: ABC Corp"
  const companyPattern = /(?:company|org|organization|employer|works?\s+at|@)[\s:|-]+([^,\n]+)/i;
  const companyMatch = text.match(companyPattern);
  if (companyMatch) {
    return companyMatch[1].trim().substring(0, 100);
  }
  
  // Try to extract from URL domain
  if (url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      // Don't use common domains as company names
      const commonDomains = ['linkedin.com', 'twitter.com', 'facebook.com', 'gmail.com', 'google.com', 'github.com'];
      if (!commonDomains.some(d => hostname.includes(d))) {
        // Extract domain name and capitalize
        const domain = hostname.split('.')[0];
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      }
    } catch {
      // Invalid URL, ignore
    }
  }
  
  return '';
}

/**
 * Parse selected text and extract lead information
 */
export function parseSelection(text: string, sourceUrl: string): CreateLeadInput {
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const linkedIn = extractLinkedIn(text);
  const website = extractWebsite(text);
  const name = extractName(text);
  const company = extractCompany(text, sourceUrl);
  
  return {
    name,
    email: email || undefined,
    phone: phone || undefined,
    linkedIn: linkedIn || undefined,
    website: website || undefined,
    company: company || undefined,
    sourceUrl,
    notes: '',
    tags: [],
  };
}

/**
 * Parse from LinkedIn profile page
 */
export function parseLinkedInProfile(pageContent: {
  name?: string;
  headline?: string;
  company?: string;
  profileUrl: string;
}): CreateLeadInput {
  return {
    name: pageContent.name || 'Unknown',
    company: pageContent.company || '',
    linkedIn: pageContent.profileUrl,
    sourceUrl: pageContent.profileUrl,
    notes: pageContent.headline || '',
    tags: ['linkedin'],
  };
}

/**
 * Clean and validate URL
 */
export function cleanUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.href;
  } catch {
    // Try adding https://
    try {
      const urlObj = new URL('https://' + url);
      return urlObj.href;
    } catch {
      return url;
    }
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}
