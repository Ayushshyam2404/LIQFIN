"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEmailBody = exports.stripHtml = exports.decodeBase64 = exports.decodeQuotedPrintable = void 0;
/**
 * Decodes quoted-printable encoded strings (common in emails)
 */
const decodeQuotedPrintable = (str) => {
    return str
        .replace(/=\r?\n/g, '') // remove soft line breaks
        .replace(/=([0-9A-F]{2})/gi, (_, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });
};
exports.decodeQuotedPrintable = decodeQuotedPrintable;
/**
 * Decodes base64 encoded strings
 */
const decodeBase64 = (str) => {
    return Buffer.from(str, 'base64').toString('utf-8');
};
exports.decodeBase64 = decodeBase64;
/**
 * Strips HTML tags and decodes common HTML entities
 */
const stripHtml = (html) => {
    return html
        .replace(/<style([\s\S]*?)<\/style>/gi, '')
        .replace(/<script([\s\S]*?)<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
};
exports.stripHtml = stripHtml;
/**
 * Parses a raw email string and extracts the text content (either plain text or HTML converted to text)
 */
const extractEmailBody = (rawEmail) => {
    // If the email is simple plain text
    if (!rawEmail.includes('Content-Type:')) {
        return rawEmail;
    }
    // Split headers and body
    const boundaryMatch = rawEmail.match(/boundary="?([^"\s;]+)"?/i);
    const boundary = boundaryMatch ? boundaryMatch[1] : null;
    if (boundary) {
        const parts = rawEmail.split(`--${boundary}`);
        let textPart = '';
        let htmlPart = '';
        for (const part of parts) {
            if (part.includes('Content-Type: text/plain')) {
                textPart = part;
                break; // Prefer plain text
            }
            else if (part.includes('Content-Type: text/html')) {
                htmlPart = part;
            }
        }
        const selectedPart = textPart || htmlPart;
        if (selectedPart) {
            return decodePart(selectedPart);
        }
    }
    // Fallback: decode the whole message after headers
    const headerEndIndex = rawEmail.indexOf('\r\n\r\n');
    const body = headerEndIndex !== -1 ? rawEmail.substring(headerEndIndex + 4) : rawEmail;
    return decodePart(body);
};
exports.extractEmailBody = extractEmailBody;
const decodePart = (part) => {
    // Find encoding
    const encodingMatch = part.match(/Content-Transfer-Encoding:\s*([a-zA-Z0-9\-]+)/i);
    const encoding = encodingMatch ? encodingMatch[1].toLowerCase() : '';
    // Get body of this part
    const headerEnd = part.indexOf('\r\n\r\n');
    let body = headerEnd !== -1 ? part.substring(headerEnd + 4) : part;
    // Clean trailing boundaries/newlines
    body = body.replace(/\r?\n--.*$/, '').trim();
    let decoded = body;
    if (encoding === 'quoted-printable') {
        decoded = (0, exports.decodeQuotedPrintable)(body);
    }
    else if (encoding === 'base64') {
        decoded = (0, exports.decodeBase64)(body);
    }
    // Check if it's HTML
    if (part.includes('Content-Type: text/html') || decoded.trim().startsWith('<')) {
        decoded = (0, exports.stripHtml)(decoded);
    }
    return decoded;
};
