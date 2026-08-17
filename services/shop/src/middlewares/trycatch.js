const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        // Without this the real cause never reaches the Render logs and the
        // client only sees a bare 500.
        console.error(`${req.method} ${req.originalUrl} failed:`, error);

        // Bad input from the client is a 400, not a server fault.
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        // error.statusCode can be absent or non-numeric (axios sets string
        // codes like ERR_BAD_RESPONSE); res.status() throws on those.
        const status =
            Number.isInteger(error.statusCode) &&
            error.statusCode >= 400 &&
            error.statusCode <= 599
                ? error.statusCode
                : 500;

        res.status(status).json({
            success: false,
            message: error.message,
        });
    }
};

export default asyncHandler;
