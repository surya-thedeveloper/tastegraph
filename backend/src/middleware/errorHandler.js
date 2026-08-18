function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);

  // neo4j driver errors when the DB is unreachable
  if (err.code === 'ServiceUnavailable' || err.message?.includes('Could not connect')) {
    return res.status(503).json({
      error: 'Database unavailable',
      message: 'Could not reach CognoDB. Please try again in a moment.',
    });
  }

  // timeout
  if (err.code === 'N/A' || err.message?.includes('acquisition timeout')) {
    return res.status(503).json({
      error: 'Database timeout',
      message: 'The query took too long. The database might be waking up — try again.',
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: err.name || 'InternalError',
    message: err.message || 'Something went wrong',
  });
}

module.exports = errorHandler;
