require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/database');

// Initialize app
const app = express();

// Connect to MongoDB
connectDB();

// --- VIEW ENGINE & STATIC FILES ---
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// --- BODY PARSER ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --- SESSION CONFIGURATION ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'hostelhub_secret_key_2024',
    resave: true, // Changed to true to ensure session is saved on every request
    saveUninitialized: false, // Changed to false to not save uninitialized sessions
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true, // Prevent client-side JS from accessing the cookie
        sameSite: 'lax', // CSRF protection
        secure: process.env.NODE_ENV === 'production' ? true : false // HTTPS only in production
    },
    name: 'hostelhub_session' // Custom session name
}));

// --- MIDDLEWARE ---
const { setLocals } = require('./middleware/locals');
const { errorHandler, notFound } = require('./middleware/errorHandler');

app.use(setLocals);

// --- ROUTES ---
const authRoutes = require('./routes/authRoutes');
const hostelRoutes = require('./routes/hostelRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const studentRoutes = require('./routes/studentRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const roomRoutes = require('./routes/roomRoutes');
const profileRoutes = require('./routes/profileRoutes');
const chatRoutes = require('./routes/chatRoutes');
const communityRoutes = require('./routes/communityRoutes');
const pageRoutes = require('./routes/pageRoutes');

// Apply routes
app.use('/', authRoutes);
app.use('/', hostelRoutes);
app.use('/', bookingRoutes);
app.use('/', studentRoutes);
app.use('/', ownerRoutes);
app.use('/', roomRoutes);
app.use('/', profileRoutes);
app.use('/', chatRoutes);
app.use('/', communityRoutes);
app.use('/', pageRoutes);

// --- ERROR HANDLERS (must be last) ---
app.use(notFound);
app.use(errorHandler);

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
