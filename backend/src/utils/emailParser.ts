export interface ParsedTransaction {
  amount: number;
  originalAmount: string;
  merchant: string;
  cardDigits: string;
  bankName: string;
  date?: Date;
  category: string;
  creditLimit?: number;
  availableLimit?: number;
}

// Map merchants to standard categories
export const classifyMerchantCategory = (merchant: string): string => {
  const m = merchant.toUpperCase();
  
  if (m.includes('STARBU') || m.includes('IZAKAYA') || m.includes('FOOD') || m.includes('RESTAURANT') || m.includes('CAFE') || m.includes('NOBU') || m.includes('SWEETGREEN') || m.includes('EAT')) {
    return 'Food';
  }
  if (m.includes('WHOLE FOOD') || m.includes('TRADER JOE') || m.includes('MARKET') || m.includes('GROCER') || m.includes('EREWHON') || m.includes('SUPERMARKET')) {
    return 'Groceries';
  }
  if (m.includes('DELTA') || m.includes('AIR') || m.includes('HOTEL') || m.includes('TRAVEL') || m.includes('UBER') || m.includes('LYFT') || m.includes('CAB')) {
    return 'Travel';
  }
  if (m.includes('CHEVRON') || m.includes('GAS') || m.includes('FUEL') || m.includes('SHELL') || m.includes('TRANSPORT')) {
    return 'Transportation';
  }
  if (m.includes('NETFLIX') || m.includes('SPOTIFY') || m.includes('GYM') || m.includes('EQUINOX') || m.includes('ENTERTAINMENT') || m.includes('CINEMA')) {
    return 'Entertainment';
  }
  if (m.includes('ZARA') || m.includes('NIKE') || m.includes('AMAZON') || m.includes('APPLE STORE') || m.includes('SHOPPING') || m.includes('CLOTH')) {
    return 'Shopping';
  }
  if (m.includes('BILL') || m.includes('INTERNET') || m.includes('FIBER') || m.includes('INSURANCE') || m.includes('TELECOM')) {
    return 'Bills';
  }
  if (m.includes('CLINIC') || m.includes('DENTAL') || m.includes('HEALTH') || m.includes('MEDICAL') || m.includes('HOSPITAL')) {
    return 'Healthcare';
  }
  if (m.includes('INVEST') || m.includes('STOCK') || m.includes('MUTUAL') || m.includes('EQUITY')) {
    return 'Investments';
  }
  return 'Miscellaneous';
};

// Regex parser to extract banking emails data
export const parseTransactionEmail = (emailContent: string): ParsedTransaction | null => {
  try {
    // 1. Extract Amount
    // Matches e.g. "INR 294" or "Transaction Amount:\nINR 294" or "spent Rs. 500"
    const amountRegex = /(?:Transaction Amount|Amount|Spent|spent|Value|INR|Rs\.)\s*:?\s*(?:INR|Rs\.)?\s*([\d,]+(?:\.\d+)?)/i;
    const amountMatch = emailContent.match(amountRegex);
    if (!amountMatch) return null;
    
    const rawAmount = amountMatch[1].replace(/,/g, '');
    const amountNum = parseFloat(rawAmount);

    // Get original currency unit
    const isINR = emailContent.includes('INR') || emailContent.includes('Rs.');
    // Keep raw amount as base amount (so user sees actual currency denomination)
    const baseAmount = amountNum;
    const originalAmountStr = isINR ? `INR ${amountNum}` : `$${amountNum}`;

    // 2. Extract Merchant
    // Matches e.g. "Merchant Name:\nTATA STARBU" or "at TATA STARBU"
    let merchantRegex = /(?:Merchant Name|Merchant)\s*:?\s*\n?\s*([A-Za-z0-9\s\-&]+?)(?:\n|\r|Axis Bank|$)/i;
    let merchantMatch = emailContent.match(merchantRegex);
    
    if (!merchantMatch) {
      // Fallback to "at" or "to" but avoid "to me"
      const fallbackRegex = /(?:at|to)\s+([A-Za-z0-9\s\-&]+?)(?:\n|\r|Axis Bank|$)/i;
      const fallbackMatch = emailContent.match(fallbackRegex);
      if (fallbackMatch) {
        const val = fallbackMatch[1].trim();
        if (!['me', 'my', 'dear', 'us', 'you'].includes(val.toLowerCase())) {
          merchantMatch = fallbackMatch;
        }
      }
    }
    
    let merchantName = 'Unknown Merchant';
    if (merchantMatch) {
      merchantName = merchantMatch[1].trim();
      // Remove trailing words like "Credit Card"
      merchantName = merchantName.replace(/(?:Ltd|Inc|Bank|Credit|Card)/gi, '').trim();
    }

    // 3. Extract Card Number
    // Matches e.g. "Credit Card No.\nXX2629" or "ending in 2629" or "BLOCK 2629"
    const cardRegex = /(?:Credit Card No|Card No|Card|BLOCK)\s*\.?\s*:?\s*([X\d]*\d{4})/i;
    const cardMatch = emailContent.match(cardRegex);
    let cardDigits = '0000';
    if (cardMatch) {
      const fullMatch = cardMatch[1];
      cardDigits = fullMatch.substring(fullMatch.length - 4);
    }

    // 4. Extract Bank Name
    // Matches e.g. "Axis Bank Alerts" or "Axis Bank Ltd."
    const bankRegex = /([A-Za-z]+ Bank)/i;
    const bankMatch = emailContent.match(bankRegex);
    const bankName = bankMatch ? bankMatch[1].trim() : 'Axis Bank';

    // 5. Extract Limits (if available in email)
    // Available Limit: INR 29506
    // Total Credit Limit: INR 30000
    const limitRegex = /Total Credit Limit\s*\*?\s*:?\s*(?:INR|Rs\.)?\s*([\d,]+(?:\.\d+)?)/i;
    const limitMatch = emailContent.match(limitRegex);
    let creditLimit: number | undefined;
    if (limitMatch) {
      creditLimit = parseFloat(limitMatch[1].replace(/,/g, ''));
    }

    const availRegex = /Available Limit\s*\*?\s*:?\s*(?:INR|Rs\.)?\s*([\d,]+(?:\.\d+)?)/i;
    const availMatch = emailContent.match(availRegex);
    let availableLimit: number | undefined;
    if (availMatch) {
      availableLimit = parseFloat(availMatch[1].replace(/,/g, ''));
    }

    // 5.5 Extract Date and Time from email body if possible
    let parsedDate: Date | undefined;
    const dateRegex = /(?:Date\s*&\s*Time|Date|Date\s*:\s*)\s*:?\s*([\d]{2})-([\d]{2})-([\d]{4})(?:\s*,\s*([\d]{2}):([\d]{2}):([\d]{2}))?/i;
    const dateMatch = emailContent.match(dateRegex);
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1; // 0-indexed
      const year = parseInt(dateMatch[3], 10);
      const hour = dateMatch[4] ? parseInt(dateMatch[4], 10) : 0;
      const minute = dateMatch[5] ? parseInt(dateMatch[5], 10) : 0;
      const second = dateMatch[6] ? parseInt(dateMatch[6], 10) : 0;
      
      const isoStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}+05:30`;
      const tempDate = new Date(isoStr);
      if (!isNaN(tempDate.getTime())) {
        parsedDate = tempDate;
      } else {
        parsedDate = new Date(year, month, day, hour, minute, second);
      }
    }

    // 6. Extract Category
    const category = classifyMerchantCategory(merchantName);

    return {
      amount: baseAmount,
      originalAmount: originalAmountStr,
      merchant: merchantName,
      cardDigits,
      bankName,
      date: parsedDate,
      category,
      creditLimit,
      availableLimit
    };
  } catch (error) {
    console.error('Error parsing email content:', error);
    return null;
  }
};
