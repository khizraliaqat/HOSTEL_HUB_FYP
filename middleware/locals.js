const Message = require('../models/Message');

// Middleware to set locals for all views
exports.setLocals = async (req, res, next) => {
    try {
        // Ensure session object exists
        if (!req.session) {
            req.session = {};
        }

        // Set user from session
        res.locals.user = req.session.user || null;
        res.locals.query = req.query || {};

        // Verify user session is valid if user exists
        if (req.session.user) {
            // Refresh session timeout on every request
            req.session.touch();
            
            try {
                // Get unread message count for logged-in users
                const count = await Message.countDocuments({
                    receiver: req.session.user.id,
                    is_read: false
                });
                res.locals.unreadCount = count;
            } catch (error) {
                console.error('Error fetching unread count:', error);
                res.locals.unreadCount = 0;
            }
        } else {
            res.locals.unreadCount = 0;
        }

        next();
    } catch (error) {
        console.error('Error in setLocals middleware:', error);
        res.locals.user = null;
        res.locals.unreadCount = 0;
        res.locals.query = req.query || {};
        next();
    }
};
