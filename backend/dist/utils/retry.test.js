"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const node_test_1 = __importDefault(require("node:test"));
const retry_1 = require("./retry");
(0, node_test_1.default)('retry utility - succeeds on first attempt', async () => {
    let calls = 0;
    const result = await (0, retry_1.retry)(async () => {
        calls++;
        return 'success';
    }, 3, 5, 1.5);
    node_assert_1.default.strictEqual(result, 'success');
    node_assert_1.default.strictEqual(calls, 1);
});
(0, node_test_1.default)('retry utility - retries and eventually succeeds', async () => {
    let calls = 0;
    const result = await (0, retry_1.retry)(async () => {
        calls++;
        if (calls < 3) {
            throw new Error('temporary failure');
        }
        return 'success';
    }, 4, 5, 1.5);
    node_assert_1.default.strictEqual(result, 'success');
    node_assert_1.default.strictEqual(calls, 3);
});
(0, node_test_1.default)('retry utility - throws error after max retries', async () => {
    let calls = 0;
    await node_assert_1.default.rejects(async () => {
        await (0, retry_1.retry)(async () => {
            calls++;
            throw new Error('persistent failure');
        }, 3, 5, 1.5);
    }, (err) => {
        node_assert_1.default.strictEqual(err.message, 'persistent failure');
        return true;
    });
    node_assert_1.default.strictEqual(calls, 3);
});
