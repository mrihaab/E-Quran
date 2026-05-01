const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';

const { app, io } = require('../server');

test.after(() => {
  io.close();
});

test('GET /api/health returns service status', async () => {
  const response = await new Promise((resolve, reject) => {
    const listener = app.listen(0, () => {
      const { port } = listener.address();

      fetch(`http://127.0.0.1:${port}/api/health`)
        .then(resolve)
        .catch(reject)
        .finally(() => listener.close());
    });

    listener.on('error', reject);
  });

  assert.equal(response.status, 200);
  const body = await response.json();

  assert.equal(body.success, true);
  assert.equal(body.status, 'ok');
  assert.equal(body.version, '1.0.0');
  assert.match(body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});
