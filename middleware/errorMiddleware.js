// Catches any route that doesn't match.
export function notFound(req, res, next) {
    res.status(404);
    next(new Error(`Route not found: ${req.originalUrl}`));
}

// Central error handler — every controller can just `throw` or call
// next(err) and it lands here with a consistent JSON shape.
export function errorHandler(err, req, res, next) {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
}