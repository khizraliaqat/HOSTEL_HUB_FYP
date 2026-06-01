const Hostel = require('../models/Hostel');
const MessMenu = require('../models/MessMenu');

// @desc    Show manage hostel announcement page
// @route   GET /manage_hostel/:id
exports.showManageHostel = async (req, res) => {
    try {
        const hostel = await Hostel.findOne({
            _id: req.params.id,
            owner: req.session.user.id
        }).lean();

        if (!hostel) {
            return res.status(404).send('Hostel not found');
        }

        res.render('manage_hostel', {
            hostel_id: hostel._id,
            announcement: hostel.announcement_text || ''
        });
    } catch (error) {
        console.error('Show Manage Hostel Error:', error);
        res.status(500).send('Error loading page');
    }
};

// @desc    Update hostel announcement
// @route   POST /manage_hostel
exports.updateAnnouncement = async (req, res) => {
    try {
        const { hostel_id, text } = req.body;

        const hostel = await Hostel.findOne({
            _id: hostel_id,
            owner: req.session.user.id
        });

        if (!hostel) {
            return res.status(404).send('Hostel not found');
        }

        hostel.announcement_text = text || '';
        await hostel.save();

        res.redirect('/owner_dashboard?msg=announcement_updated');
    } catch (error) {
        console.error('Update Announcement Error:', error);
        res.status(500).send('Error updating announcement');
    }
};

// @desc    Show manage mess menu page
// @route   GET /manage_mess/:id
exports.showManageMess = async (req, res) => {
    try {
        const hostel = await Hostel.findOne({
            _id: req.params.id,
            owner: req.session.user.id
        }).lean();

        if (!hostel) {
            return res.status(404).send('Hostel not found');
        }

        // Get existing mess menu
        const messMenu = await MessMenu.find({ hostel: hostel._id }).lean();

        // Create a map for easy access
        const menuMap = {};
        messMenu.forEach(item => {
            menuMap[item.day_name] = item;
        });

        res.render('manage_mess', {
            hostel_id: hostel._id,
            hostel_name: hostel.name,
            menu: menuMap
        });
    } catch (error) {
        console.error('Show Manage Mess Error:', error);
        res.status(500).send('Error loading mess menu');
    }
};

// @desc    Update mess menu
// @route   POST /manage_mess
exports.updateMessMenu = async (req, res) => {
    try {
        const { hostel_id, day, breakfast, lunch, dinner } = req.body;

        const hostel = await Hostel.findOne({
            _id: hostel_id,
            owner: req.session.user.id
        });

        if (!hostel) {
            return res.status(404).send('Hostel not found');
        }

        // Delete existing menu for this hostel
        await MessMenu.deleteMany({ hostel: hostel_id });

        // Insert new menu items
        if (day && Array.isArray(day)) {
            const menuItems = day.map((dayName, index) => ({
                hostel: hostel_id,
                day_name: dayName,
                breakfast: breakfast[index] || '',
                lunch: lunch[index] || '',
                dinner: dinner[index] || ''
            }));

            await MessMenu.insertMany(menuItems);
        }

        res.redirect('/owner_dashboard?msg=mess_updated');
    } catch (error) {
        console.error('Update Mess Menu Error:', error);
        res.status(500).send('Error updating mess menu');
    }
};
