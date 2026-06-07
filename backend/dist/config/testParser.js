"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emailParser_1 = require("../utils/emailParser");
const emailContent = `
INR 706.82 spent on credit card no. XX2629
Inbox

Axis Bank Alerts <alerts@axis.bank.in>
5:52 AM (43 minutes ago)
to me


CLICK HERE

07-06-2026

Dear Ayush Shyam,


Here's the summary of your Axis Bank Credit Card Transaction:
	
Transaction Amount:
INR 706.82
	
Merchant Name:
Reliance Re
	
Axis Bank Credit Card No.
XX2629
	
Date & Time:
07-06-2026, 05:52:49 IST
	
Available Limit*:
INR 25391.08
	
Total Credit Limit*:
INR 30000
`;
console.log('--- PARSER TEST RESULTS ---');
console.log(JSON.stringify((0, emailParser_1.parseTransactionEmail)(emailContent), null, 2));
console.log('---------------------------');
