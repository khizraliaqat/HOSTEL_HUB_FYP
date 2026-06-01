const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Review = require('../models/Review');
const MessMenu = require('../models/MessMenu');
const Wishlist = require('../models/Wishlist');

// @desc    Get all hostels with filters and pagination
// @route   GET /
exports.getHostels = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        // Build query
        let query = { is_active: true };

        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.price) {
            query.price = { $lte: parseFloat(req.query.price) };
        }
        if (req.query.area && !req.query.category) {
            query.$or = [
                { area: { $regex: req.query.area, $options: 'i' } },
                { name: { $regex: req.query.area, $options: 'i' } }
            ];
        }

        const totalItems = await Hostel.countDocuments(query);
        const totalPages = Math.ceil(totalItems / limit);

        const hostels = await Hostel.find(query)
            .populate('owner', 'name email')
            .limit(limit)
            .skip(skip)
            .lean();

        let wishlistIds = [];
        if (req.session.user && req.session.user.role === 'student') {
            const wishlistRows = await Wishlist.find({
                student: req.session.user.id
            }).select('hostel').lean();

            wishlistIds = wishlistRows.map((row) => String(row.hostel));
        }

        res.render('index', {
            hostels,
            wishlistIds,
            query: req.query,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error('Get Hostels Error:', error);
        res.status(500).send('Error fetching hostels');
    }
};

// @desc    Get hostel details
// @route   GET /details/:id
exports.getHostelDetails = async (req, res) => {
    try {
        const hostelId = req.params.id;
        const includeMessFlag = (req.query.include_mess === '1' || req.query.include_mess === 'on');

        // Increment views
        await Hostel.findByIdAndUpdate(hostelId, { $inc: { views: 1 } });

        // Get hostel with populated owner
        const hostel = await Hostel.findById(hostelId).populate('owner', 'name email').lean();
        if (!hostel) {
            return res.status(404).send('Hostel not found');
        }

        // Get mess menu
        const mess = await MessMenu.find({ hostel: hostelId }).lean();

        // Get reviews with user info
        const reviews = await Review.find({ hostel: hostelId })
            .populate('student', 'name profile_pic')
            .sort({ createdAt: -1 })
            .lean();

        // Calculate rating
        const ratingStats = await Review.aggregate([
            { $match: { hostel: hostel._id } },
            {
                $group: {
                    _id: null,
                    avg: { $avg: '$rating' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const rating = ratingStats.length > 0
            ? { avg: ratingStats[0].avg, count: ratingStats[0].count }
            : { avg: 0, count: 0 };

        // Get rooms
        const rooms = await Room.find({ hostel: hostelId, is_active: true }).lean();
        
        // Add available seats to rooms
        for (let room of rooms) {
            room.available = Math.max(0, room.total_seats - room.occupied_seats);
        }

        // Check if owner
        const is_owner = req.session.user && hostel.owner && req.session.user.id == hostel.owner._id.toString();
        const isStudent = req.session.user && req.session.user.role === 'student';

        let isWishlisted = false;
        if (isStudent) {
            const wish = await Wishlist.findOne({
                student: req.session.user.id,
                hostel: hostel._id
            }).lean();
            isWishlisted = Boolean(wish);
        }

        res.render('details', {
            hostel,
            images: hostel.images || [],
            mess,
            reviews,
            rating,
            rooms,
            is_owner,
            isWishlisted,
            include_mess: includeMessFlag
        });
    } catch (error) {
        console.error('Get Hostel Details Error:', error);
        res.status(500).send('Error fetching hostel details');
    }
};

// @desc    Compare two hostels
// @route   GET /compare
exports.compareHostels = async (req, res) => {
    try {
        const { h1, h2 } = req.query;
        if (!h1 || !h2) {
            return res.redirect('/?error=select_two');
        }

        const hostels = await Hostel.find({ _id: { $in: [h1, h2] } }).lean();
        if (hostels.length !== 2) {
            return res.status(404).send('Hostels not found');
        }

        const h1Data = hostels.find(h => h._id.toString() === h1);
        const h2Data = hostels.find(h => h._id.toString() === h2);

        let priceWinner = h1Data.price < h2Data.price
            ? h1Data._id
            : (h2Data.price < h1Data.price ? h2Data._id : null);

        res.render('compare', { h1: h1Data, h2: h2Data, priceWinner });
    } catch (error) {
        console.error('Compare Hostels Error:', error);
        res.status(500).send('Error comparing hostels');
    }
};

// @desc    Add hostel
// @route   POST /add_hostel
exports.addHostel = async (req, res) => {
    try {
        const { name, category, area, price, mess_fee, desc, map_embed, facilities, day, bkf, lun, din } = req.body;

        // Prepare facilities array
        const facilitiesArray = Array.isArray(facilities) ? facilities : (facilities ? [facilities] : []);

        // Create hostel
        const hostel = await Hostel.create({
            owner: req.session.user.id,
            name,
            category,
            area,
            price,
            mess_fee: mess_fee || 0,
            description: desc,
            facilities: facilitiesArray,
            map_embed
        });

        // Handle images
        if (req.files && req.files.length > 0) {
            const imageNames = req.files.map(file => file.filename);
            hostel.images = imageNames;
            hostel.image = imageNames[0];
            await hostel.save();
        }

        // Add mess menu
        if (day && Array.isArray(day)) {
            const menuItems = day.map((dayName, index) => ({
                hostel: hostel._id,
                day_name: dayName,
                breakfast: bkf[index] || '',
                lunch: lun[index] || '',
                dinner: din[index] || ''
            }));
            await MessMenu.insertMany(menuItems);
        }

        res.redirect('/owner_dashboard?msg=added');
    } catch (error) {
        console.error('Add Hostel Error:', error);
        res.status(500).send('Error adding hostel');
    }
};

// @desc    Show add hostel page
// @route   GET /add_hostel
exports.showAddHostel = (req, res) => {
    res.render('add_hostel');
};

// @desc    Show edit hostel page
// @route   GET /edit_hostel/:id
exports.showEditHostel = async (req, res) => {
    try {
        const hostel = await Hostel.findOne({
            _id: req.params.id,
            owner: req.session.user.id
        }).lean();

        if (!hostel) {
            return res.status(404).send('Hostel not found');
        }

        res.render('edit_hostel', { hostel, images: hostel.images || [] });
    } catch (error) {
        console.error('Show Edit Hostel Error:', error);
        res.status(500).send('Error loading edit page');
    }
};

// @desc    Update hostel
// @route   POST /edit_hostel/:id
exports.updateHostel = async (req, res) => {
    try {
        const { name, category, area, price, mess_fee, desc, map_embed, facilities } = req.body;
        const facilitiesArray = Array.isArray(facilities) ? facilities : (facilities ? [facilities] : []);

        const hostel = await Hostel.findOne({
            _id: req.params.id,
            owner: req.session.user.id
        });

        if (!hostel) {
            return res.status(404).send('Hostel not found');
        }

        // Update fields
        hostel.name = name;
        hostel.category = category;
        hostel.area = area;
        hostel.price = price;
        hostel.mess_fee = mess_fee || 0;
        hostel.description = desc;
        hostel.facilities = facilitiesArray;
        hostel.map_embed = map_embed;

        // Handle new images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.filename);
            hostel.images = [...(hostel.images || []), ...newImages];
            if (!hostel.image) {
                hostel.image = newImages[0];
            }
        }

        await hostel.save();
        res.redirect('/owner_dashboard?msg=updated');
    } catch (error) {
        console.error('Update Hostel Error:', error);
        res.status(500).send('Error updating hostel');
    }
};

// @desc    Delete hostel
// @route   GET /delete_hostel/:id
exports.deleteHostel = async (req, res) => {
    try {
        await Hostel.findOneAndDelete({
            _id: req.params.id,
            owner: req.session.user.id
        });
        res.redirect('/owner_dashboard?msg=deleted');
    } catch (error) {
        console.error('Delete Hostel Error:', error);
        res.status(500).send('Error deleting hostel');
    }
};

// @desc    Delete a hostel image
// @route   GET /delete_image/:id
exports.deleteImage = async (req, res) => {
    try {
        const hostelId = req.query.hostel_id;
        const imageName = decodeURIComponent(req.params.id || '');

        if (!hostelId || !imageName) {
            return res.redirect('/owner_dashboard?msg=image_remove_error');
        }

        const hostel = await Hostel.findOne({
            _id: hostelId,
            owner: req.session.user.id
        });

        if (!hostel) {
            return res.status(404).send('Hostel not found');
        }

        hostel.images = (hostel.images || []).filter((img) => String(img) !== String(imageName));

        if (String(hostel.image || '') === String(imageName)) {
            hostel.image = hostel.images.length > 0 ? hostel.images[0] : '';
        }

        await hostel.save();
        res.redirect(`/edit_hostel/${hostelId}?msg=image_removed`);
    } catch (error) {
        console.error('Delete Hostel Image Error:', error);
        res.redirect('/owner_dashboard?msg=image_remove_error');
    }
};

// @desc    Submit review
// @route   POST /submit_review
exports.submitReview = async (req, res) => {
    try {
        const { hostel_id, rating, comment } = req.body;

        await Review.findOneAndUpdate(
            { hostel: hostel_id, student: req.session.user.id },
            { rating, comment },
            { upsert: true, new: true }
        );

        res.redirect('/details/' + hostel_id);
    } catch (error) {
        console.error('Submit Review Error:', error);
        res.redirect('/details/' + req.body.hostel_id + '?error=review_failed');
    }
};
