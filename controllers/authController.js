const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { PASSWORD_POLICY_MESSAGE, isStrongPassword } = require('../utils/passwordPolicy');

const LOGIN_MESSAGES = {
    password_reset_success: 'Password updated successfully. You can now login with your new password.'
};

const FORGOT_PASSWORD_MESSAGES = {
    reset_link_sent: 'If that email exists, a reset link has been prepared. Please check your inbox.',
    reset_error: 'Unable to process your request right now. Please try again.',
    invalid_email: 'Please enter a valid email address.'
};

function getBaseUrl(req) {
    if (process.env.APP_URL) return process.env.APP_URL;
    return `${req.protocol}://${req.get('host')}`;
}

function getLoginMessage(code) {
    if (!code) return null;
    return LOGIN_MESSAGES[code] || String(code);
}

function getForgotPasswordMessage(code) {
    return FORGOT_PASSWORD_MESSAGES[code] || null;
}

function createMailTransporter() {
    if (!process.env.SMTP_HOST) return null;

    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    const config = {
        host: process.env.SMTP_HOST,
        port,
        secure
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        config.auth = {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        };
    }

    return nodemailer.createTransport(config);
}

async function sendPasswordResetEmail(email, resetUrl) {
    const transporter = createMailTransporter();
    if (!transporter) return false;

    await transporter.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@hostelhub.local',
        to: email,
        subject: 'HostelHub Password Reset',
        text: `Reset your HostelHub password using this link: ${resetUrl}\n\nThis link expires in 1 hour.`,
        html: `
            <p>Reset your HostelHub password using the link below:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link expires in 1 hour.</p>
        `
    });

    return true;
}

// @desc    Register new user
// @route   POST /register
exports.register = async (req, res) => {
    try {
        const { name, email, password, confirm_password, role } = req.body;

        if (password !== confirm_password) {
            return res.render('register', { error: 'Passwords do not match' });
        }

        if (!isStrongPassword(password)) {
            return res.render('register', { error: PASSWORD_POLICY_MESSAGE });
        }

        const existingUser = await User.findOne({ email: String(email || '').toLowerCase().trim() });
        if (existingUser) {
            return res.render('register', { error: 'Email already exists' });
        }

        await User.create({
            name,
            email,
            password,
            role: role || 'student'
        });

        res.redirect('/login');
    } catch (error) {
        console.error('Register Error:', error);
        res.render('register', { error: 'Registration failed. Please try again.' });
    }
};

// @desc    Login user
// @route   POST /login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
        if (!user) {
            return res.render('login', { error: 'Email not found', msg: null });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', { error: 'Incorrect password', msg: null });
        }

        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile_pic: user.profile_pic
        };

        if (user.role === 'owner') {
            return res.redirect('/owner_dashboard');
        }
        if (user.role === 'student') {
            return res.redirect('/student_dashboard');
        }
        res.redirect('/');
    } catch (error) {
        console.error('Login Error:', error);
        res.render('login', { error: 'Login failed. Please try again.', msg: null });
    }
};

// @desc    Logout user
// @route   GET /logout
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout Error:', err);
        res.redirect('/login');
    });
};

// @desc    Show login page
// @route   GET /login
exports.showLogin = (req, res) => {
    res.render('login', {
        error: null,
        msg: getLoginMessage(req.query.msg)
    });
};

// @desc    Show register page
// @route   GET /register
exports.showRegister = (req, res) => {
    res.render('register', { error: null });
};

// @desc    Show forgot-password page
// @route   GET /forgot_password
exports.showForgotPassword = (req, res) => {
    res.render('forgot_password', {
        error: null,
        msg: getForgotPasswordMessage(req.query.msg)
    });
};

// @desc    Request password reset
// @route   POST /forgot_password
exports.requestPasswordReset = async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!email) {
            return res.redirect('/forgot_password?msg=invalid_email');
        }

        const user = await User.findOne({ email });
        if (user) {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

            user.reset_password_token = hashedToken;
            user.reset_password_expires = new Date(Date.now() + 60 * 60 * 1000);
            await user.save();

            const resetUrl = `${getBaseUrl(req)}/reset_password/${rawToken}`;

            let sent = false;
            try {
                sent = await sendPasswordResetEmail(user.email, resetUrl);
            } catch (mailError) {
                console.error('Password reset email error:', mailError);
            }

            // Dev-safe fallback when SMTP is not configured or mail sending fails.
            if (!sent) {
                console.log(`[Password Reset Link] ${user.email}: ${resetUrl}`);
            }
        }

        return res.redirect('/forgot_password?msg=reset_link_sent');
    } catch (error) {
        console.error('Request Password Reset Error:', error);
        return res.redirect('/forgot_password?msg=reset_error');
    }
};

// @desc    Show reset-password page
// @route   GET /reset_password/:token
exports.showResetPassword = async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            reset_password_token: hashedToken,
            reset_password_expires: { $gt: new Date() }
        });

        if (!user) {
            return res.render('reset_password', {
                error: 'Reset link is invalid or has expired.',
                msg: null,
                token: null
            });
        }

        return res.render('reset_password', {
            error: null,
            msg: null,
            token: req.params.token
        });
    } catch (error) {
        console.error('Show Reset Password Error:', error);
        return res.render('reset_password', {
            error: 'Unable to open reset page right now.',
            msg: null,
            token: null
        });
    }
};

// @desc    Reset password using token
// @route   POST /reset_password/:token
exports.resetPassword = async (req, res) => {
    const token = req.params.token;

    try {
        const { password, confirm_password } = req.body;

        if (!password || !confirm_password) {
            return res.render('reset_password', {
                error: 'Please provide both password fields.',
                msg: null,
                token
            });
        }

        if (password !== confirm_password) {
            return res.render('reset_password', {
                error: 'Passwords do not match.',
                msg: null,
                token
            });
        }

        if (!isStrongPassword(password)) {
            return res.render('reset_password', {
                error: PASSWORD_POLICY_MESSAGE,
                msg: null,
                token
            });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            reset_password_token: hashedToken,
            reset_password_expires: { $gt: new Date() }
        });

        if (!user) {
            return res.render('reset_password', {
                error: 'Reset link is invalid or has expired.',
                msg: null,
                token: null
            });
        }

        user.password = password;
        user.reset_password_token = '';
        user.reset_password_expires = null;
        await user.save();

        return res.redirect('/login?msg=password_reset_success');
    } catch (error) {
        console.error('Reset Password Error:', error);
        return res.render('reset_password', {
            error: 'Unable to reset password right now. Please try again.',
            msg: null,
            token
        });
    }
};
