// Error handler middleware
exports.errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send('File size is too large. Maximum size is 5MB.');
    }

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).send(messages.join(', '));
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        return res.status(400).send('Duplicate entry. This record already exists.');
    }

    // Default error
    res.status(500).send(err.message || 'Internal Server Error');
};

// 404 handler
exports.notFound = (req, res) => {
    res.status(404).send('Page not found');
};
