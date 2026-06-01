// Middleware to check if user is authenticated
exports.requireAuth = (req, res, next) => {
    // Regenerate session to ensure it's fresh
    if (req.session && !req.session.user) {
        return res.redirect('/login?session_expired=true');
    }
    if (!req.session.user) {
        return res.redirect('/login?session_expired=true');
    }
    next();
};

// Middleware to check if user is a student
exports.requireStudent = (req, res, next) => {
    // Check if session exists and user data is valid
    if (!req.session || !req.session.user) {
        return res.redirect('/login?session_expired=true');
    }
    
    // Verify user role
    if (req.session.user.role !== 'student') {
        return res.status(403).render('error', { 
            error: 'Access Denied: Student role required',
            message: 'You do not have permission to access this page.'
        });
    }
    next();
};

// Middleware to check if user is an owner
exports.requireOwner = (req, res, next) => {
    // Check if session exists and user data is valid
    if (!req.session || !req.session.user) {
        return res.redirect('/login?session_expired=true');
    }
    
    // Verify user role
    if (req.session.user.role !== 'owner') {
        return res.status(403).render('error', { 
            error: 'Access Denied: Owner role required',
            message: 'You do not have permission to access this page.'
        });
    }
    next();
};

// Middleware to check if user is an admin
exports.requireAdmin = (req, res, next) => {
    // Check if session exists and user data is valid
    if (!req.session || !req.session.user) {
        return res.redirect('/login?session_expired=true');
    }
    
    // Verify user role
    if (req.session.user.role !== 'admin') {
        return res.status(403).render('error', { 
            error: 'Access Denied: Admin role required',
            message: 'You do not have permission to access this page.'
        });
    }
    next();
};

// Middleware to check if user is a super admin
exports.requireSuperAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'super_admin') {
        return res.redirect('/login');
    }
    next();
};

// Middleware to check if user is admin or super admin
exports.requireAdminOrSuperAdmin = (req, res, next) => {
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'super_admin')) {
        return res.redirect('/login');
    }
    next();
};
