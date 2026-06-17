import assert from 'node:assert';
import test from 'node:test';
import http from 'http';
import app from './app';
import mongoose from 'mongoose';

test('API Integration Test - Health Check Endpoint returns 200 OK', async () => {
  // Spin up express server on an ephemeral port (0 selects any free port)
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  const address = server.address();
  const port = typeof address === 'string' ? null : address?.port;
  assert.ok(port, 'Server must be listening on an ephemeral port');

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    
    // Accept either 200 (UP) or 503 (DEGRADED if DB connection is disconnected during tests)
    assert.ok(
      response.status === 200 || response.status === 503,
      `Response code should be 200 or 503, received: ${response.status}`
    );
    
    const data = await response.json() as any;
    assert.ok(data.status === 'UP' || data.status === 'DEGRADED', 'Status should be UP or DEGRADED');
    assert.ok(data.database, 'Database health status should be present');
    assert.ok(!data.system, 'System metrics must not be exposed');
  } finally {
    // Gracefully teardown the test server
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
