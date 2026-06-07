/**
 * Decodes quoted-printable encoded strings (common in emails)
 */
export const decodeQuotedPrintable = (str: string): string => {
  return str
    .replace(/=\r?\n/g, '') // remove soft line breaks
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
};

/**
 * Decodes base64 encoded strings
 */
export const decodeBase64 = (str: string): string => {
  return Buffer.from(str, 'base64').toString('utf-8');
};

/**
 * Strips HTML tags and decodes common HTML entities
 */
export const stripHtml = (html: string): string => {
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

/**
 * Parses a raw email string and extracts the text content (either plain text or HTML converted to text)
 */
export const extractEmailBody = (rawEmail: string): string => {
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
      } else if (part.includes('Content-Type: text/html')) {
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

const decodePart = (part: string): string => {
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
    decoded = decodeQuotedPrintable(body);
  } else if (encoding === 'base64') {
    decoded = decodeBase64(body);
  }

  // Check if it's HTML
  if (part.includes('Content-Type: text/html') || decoded.trim().startsWith('<')) {
    decoded = stripHtml(decoded);
  }

  return decoded;
};
