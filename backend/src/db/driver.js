const neo4j = require('neo4j-driver');

// keeping driver as a singleton — don't want to open a new connection on every request
let _driver = null;

function getDriver() {
  if (_driver) return _driver;

  const uri = process.env.COGNODB_URI;
  const user = process.env.COGNODB_USER || 'cognodb';
  const password = process.env.COGNODB_PASSWORD;

  if (!uri || !password) {
    throw new Error('Missing COGNODB_URI or COGNODB_PASSWORD in environment variables');
  }

  _driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    // CognoDB is small (free tier), so keeping max connections low
    maxConnectionPoolSize: 10,
    connectionAcquisitionTimeout: 5000,
  });

  return _driver;
}

async function verifyConnection() {
  const driver = getDriver();
  const session = driver.session();
  try {
    await session.run('RETURN 1');
    console.log('✓ Connected to CognoDB');
  } finally {
    await session.close();
  }
}

async function closeDriver() {
  if (_driver) {
    await _driver.close();
    _driver = null;
  }
}

module.exports = { getDriver, verifyConnection, closeDriver };
