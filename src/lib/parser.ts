import type { CreateLeadInput } from '../types/lead';

/**
 * Email regex pattern
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Phone regex patterns (various formats - international support)
 * Matches: +1 555 123 4567, (555) 123-4567, +49 123 456789, +44 20 7946 0958, etc.
 */
const PHONE_REGEX = /(?:\+[1-9]\d{0,2}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}(?:[-.\s]?\d{1,4})?/g;

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
  
  // Common words that shouldn't be part of a name (German, English, etc.)
  const stopWords = new Set([
    'ich', 'i', 'we', 'wir', 'the', 'der', 'die', 'das', 'und', 'and', 'or', 'oder',
    'at', 'bei', 'in', 'for', 'für', 'with', 'mit', 'to', 'zu', 'von', 'from',
    'help', 'helfe', 'helping', 'working', 'building', 'creating', 'leading',
    'ceo', 'cto', 'cfo', 'coo', 'founder', 'co-founder', 'cofounder',
    'manager', 'director', 'head', 'lead', 'senior', 'junior', 'chief',
    'engineer', 'developer', 'designer', 'consultant', 'specialist', 'expert',
    'software', 'product', 'project', 'marketing', 'sales', 'business',
  ]);
  
  // Look for 2-4 consecutive capitalized words that form a name
  // Stop when we hit a stop word or common job title indicator
  const words = firstLine.split(/\s+/);
  const nameWords: string[] = [];
  
  for (const word of words) {
    // Check if word starts with capital letter (including Unicode letters)
    // Matches: José, François, Müller, Øyvind, O'Brien, Joe's, etc.
    if (/^[\p{Lu}][\p{Ll}''\-]+$/u.test(word) || /^[\p{Lu}][\p{Ll}]*$/u.test(word)) {
      // Remove trailing punctuation for stop word check
      const cleanWord = word.replace(/[''\-].*$/, '').replace(/[^\p{L}]/gu, '');
      // Check if it's a stop word
      if (stopWords.has(cleanWord.toLowerCase())) {
        break; // Stop collecting name words
      }
      nameWords.push(word);
      // Most names are 2-4 words max
      if (nameWords.length >= 4) break;
    } else if (nameWords.length > 0) {
      // We had name words but hit a non-capitalized word or special char
      break;
    }
  }
  
  if (nameWords.length >= 1) {
    return nameWords.join(' ').substring(0, 100);
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
  let linkedIn = extractLinkedIn(text);
  let website = extractWebsite(text);
  const name = extractName(text);
  const company = extractCompany(text, sourceUrl);
  
  // Auto-detect LinkedIn from source URL if not found in text
  if (!linkedIn && sourceUrl.includes('linkedin.com/in/')) {
    linkedIn = sourceUrl.split('?')[0]; // Remove query params
  }
  
  // Auto-detect website from source URL
  // For social sites, keep the URL as sourceUrl only (not website field)
  // For regular websites, also set it as the website field
  if (!website && sourceUrl) {
    const socialSites = ['linkedin.com', 'twitter.com', 'facebook.com', 'instagram.com', 'x.com', 'tiktok.com', 'youtube.com'];
    const isSocialSite = socialSites.some(site => sourceUrl.includes(site));
    
    // GitHub is special - it's both a social profile AND a useful website link
    if (sourceUrl.includes('github.com/') && !sourceUrl.includes('github.com/search')) {
      website = sourceUrl.split('?')[0];
    } else if (!isSocialSite) {
      website = sourceUrl.split('?')[0];
    }
  }
  
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
