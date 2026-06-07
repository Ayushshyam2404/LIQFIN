"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = void 0;
/**
 * Reusable utility function to retry asynchronous operations with exponential backoff.
 *
 * @param fn The asynchronous function to execute.
 * @param retries Maximum number of retry attempts. Default is 3.
 * @param delay Initial delay in milliseconds before retrying. Default is 1000ms.
 * @param backoffFactor The factor to multiply the delay by after each failed attempt. Default is 2.
 */
const retry = async (fn, retries = 3, delay = 1000, backoffFactor = 2) => {
    let attempt = 1;
    while (true) {
        try {
            return await fn();
        }
        catch (error) {
            if (attempt >= retries) {
                throw error;
            }
            console.warn(`[Retry] Attempt ${attempt} failed. Retrying in ${delay}ms... Error: ${error.message}`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= backoffFactor;
            attempt++;
        }
    }
};
exports.retry = retry;
