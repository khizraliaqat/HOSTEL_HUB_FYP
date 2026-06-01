const ContactMessage = require('../models/ContactMessage');

// @desc    Show about page
// @route   GET /about
exports.getAbout = (req, res) => {
    res.render('about');
};

// @desc    Show contact page
// @route   GET /contact
exports.getContact = (req, res) => {
    res.render('contact');
};

// @desc    Submit contact message
// @route   POST /contact
exports.submitContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        await ContactMessage.create({
            name,
            email,
            subject,
            message
        });

        res.redirect('/contact');
    } catch (error) {
        console.error('Submit Contact Error:', error);
        res.redirect('/contact?error=failed');
    }
};
