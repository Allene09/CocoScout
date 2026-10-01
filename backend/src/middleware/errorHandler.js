function errorHandler(err, req, res, next) {
  console.error('[CocoScout Server Error]:', err);

  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: 'Upload error: ' + err.message,
    });
  }

  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    error: err.message || 'An unexpected server error occurred',
  });
}

module.exports = errorHandler;
