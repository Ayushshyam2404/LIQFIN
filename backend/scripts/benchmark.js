// API Performance Benchmark Script - LIQIFIN
// Uses native Node.js fetch to test endpoint response times.

const API_URL = process.env.API_URL || 'http://localhost:5001';

const runBenchmark = async () => {
  console.log(`=============================================`);
  console.log(`  LIQIFIN API Performance Benchmark`);
  console.log(`  Targeting API Server: ${API_URL}`);
  console.log(`  Timestamp: ${new Date().toISOString()}`);
  console.log(`=============================================`);

  const endpoints = [
    { name: 'Health Check Endpoint', path: '/health', method: 'GET' },
    { name: 'Auth Routes (POST Request)', path: '/api/auth/login', method: 'POST', body: { email: 'demo@liquid.finance', password: 'wrong_password_test' } }
  ];

  for (const ep of endpoints) {
    try {
      console.log(`Benchmarking: ${ep.name} (${ep.method} ${ep.path})...`);
      const durations = [];
      let lastStatus = 0;
      
      // Perform 5 runs to get a stable average
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        const res = await fetch(`${API_URL}${ep.path}`, {
          method: ep.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: ep.body ? JSON.stringify(ep.body) : undefined
        });
        const duration = Date.now() - start;
        durations.push(duration);
        lastStatus = res.status;
        
        // Small cooldown between requests
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      const sum = durations.reduce((a, b) => a + b, 0);
      const avg = (sum / durations.length).toFixed(1);
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      console.log(`  -> Response Code: ${lastStatus}`);
      console.log(`  -> Latency: Min: ${min}ms | Max: ${max}ms | Average: ${avg}ms`);
      if (avg < 200) {
        console.log(`  -> SLA Status: PASS (SLA < 200ms)`);
      } else {
        console.log(`  -> SLA Status: WARNING (Slow response time)`);
      }
      console.log('---------------------------------------------');
    } catch (err) {
      console.error(`  -> ERROR: Connection failed: ${err.message}`);
      console.log('---------------------------------------------');
    }
  }
};

runBenchmark();
