const Room = require('../models/Room');
const Hostel = require('../models/Hostel');

// @desc    Get room details
// @route   GET /room_details/:room_id
exports.getRoomDetails = async (req, res) => {
    try {
        const room = await Room.findById(req.params.room_id)
            .populate('hostel', 'name facilities mess_fee')
            .lean();

        if (!room) {
            return res.status(404).send('Room not found');
        }

        room.available = Math.max(0, room.total_seats - room.occupied_seats);
        room.hostel_name = room.hostel.name;
        room.hostel_id = room.hostel._id;

        res.render('room_details', {
            room,
            hostel: room.hostel
        });
    } catch (error) {
        console.error('Get Room Details Error:', error);
        res.status(500).send('Error fetching room details');
    }
};
