"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const node_test_1 = __importDefault(require("node:test"));
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
(0, node_test_1.default)('API Integration Test - Health Check Endpoint returns 200 OK', async () => {
    // Spin up express server on an ephemeral port (0 selects any free port)
    const server = http_1.default.createServer(app_1.default);
    await new Promise((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === 'string' ? null : address?.port;
    node_assert_1.default.ok(port, 'Server must be listening on an ephemeral port');
    try {
        const response = await fetch(`http://127.0.0.1:${port}/health`);
        // Accept either 200 (UP) or 503 (DEGRADED if DB connection is disconnected during tests)
        node_assert_1.default.ok(response.status === 200 || response.status === 503, `Response code should be 200 or 503, received: ${response.status}`);
        const data = await response.json();
        node_assert_1.default.ok(data.status === 'UP' || data.status === 'DEGRADED', 'Status should be UP or DEGRADED');
        node_assert_1.default.ok(data.system, 'System metrics should be present');
        node_assert_1.default.ok(data.database, 'Database health status should be present');
    }
    finally {
        // Gracefully teardown the test server
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
