/**
 * Helper Utility Functions
 */

/**
 * Send standardized success response
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * Send standardized error response
 */
const sendError = (res, message = 'Error occurred', statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Pagination helper
 */
const getPagination = (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    return { limit: parseInt(limit), offset: parseInt(offset) };
};

/**
 * Format pagination response
 */
const formatPaginatedResponse = (data, page, limit, total) => {
    return {
        data,
        pagination: {
            currentPage: parseInt(page),
            perPage: parseInt(limit),
            total: parseInt(total),
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Sanitize user object (remove password)
 */
const sanitizeUser = (user) => {
    if (!user) return null;
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
};

module.exports = {
    sendSuccess,
    sendError,
    getPagination,
    formatPaginatedResponse,
    sanitizeUser
};
