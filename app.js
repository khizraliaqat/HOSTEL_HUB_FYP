require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/database');

const app = express();

connectDB();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'hostelhub_secret_key_2024',
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    },
    name: 'hostelhub_session'
}));

const { setLocals } = require('./middleware/locals');
const { errorHandler, notFound } = require('./middleware/errorHandler');

app.use(setLocals);

const adminRoutes = require('./routes/adminRoutes');
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

app.use('/', adminRoutes);
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

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
    console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
});

module.exports = app;
