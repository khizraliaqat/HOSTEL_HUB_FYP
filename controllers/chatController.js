const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get chat list
// @route   GET /chat_list
exports.getChatList = async (req, res) => {
    try {
        const myId = req.session.user.id;

        // Get unique users I've chatted with
        const messages = await Message.find({
            $or: [{ sender: myId }, { receiver: myId }]
        })
            .populate('sender', 'id name role profile_pic')
            .populate('receiver', 'id name role profile_pic')
            .sort({ createdAt: -1 })
            .lean();

        // Extract unique users
        const userMap = new Map();
        messages.forEach(msg => {
            if (!msg.sender || !msg.receiver) {
                return;
            }

            const otherUser = msg.sender._id.toString() === myId
                ? msg.receiver
                : msg.sender;

            if (!otherUser || !otherUser._id) {
                return;
            }

            if (!userMap.has(otherUser._id.toString())) {
                userMap.set(otherUser._id.toString(), {
                    id: otherUser._id,
                    name: otherUser.name,
                    role: otherUser.role,
                    profile_pic: otherUser.profile_pic
                });
            }
        });

        const chats = Array.from(userMap.values());

        res.render('chat_list', { chats });
    } catch (error) {
        console.error('Get Chat List Error:', error);
        res.status(500).send('Error loading chat list');
    }
};

// @desc    Get chat with specific user
// @route   GET /chat/:id
exports.getChat = async (req, res) => {
    try {
        // Mark messages as read
        await Message.updateMany(
            { sender: req.params.id, receiver: req.session.user.id },
            { is_read: true }
        );

        const receiver = await User.findById(req.params.id).select('_id name role profile_pic').lean();
        if (!receiver) {
            return res.status(404).send('User not found');
        }

        res.render('chat', { receiver });
    } catch (error) {
        console.error('Get Chat Error:', error);
        res.status(500).send('Error loading chat');
    }
};

// @desc    Chat API (send/fetch messages)
// @route   POST /api_chat
exports.chatAPI = async (req, res) => {
    try {
        const { action, receiver_id, message } = req.body;

        if (action === 'send') {
            await Message.create({
                sender: req.session.user.id,
                receiver: receiver_id,
                message
            });
            res.send('sent');
        } else if (action === 'fetch') {
            const messages = await Message.find({
                $or: [
                    { sender: req.session.user.id, receiver: receiver_id },
                    { sender: receiver_id, receiver: req.session.user.id }
                ]
            }).sort({ createdAt: 1 }).lean();

            res.json(messages);
        } else {
            res.status(400).send('Invalid action');
        }
    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).send('Error processing chat');
    }
};

// @desc    Redirect legacy chat links
// @route   GET /chat (with query param)
exports.redirectChat = (req, res) => {
    const rid = req.query.receiver_id;
    if (rid) {
        return res.redirect('/chat/' + rid);
    }
    return res.redirect('/chat_list');
};

// @desc    Get unread message count for polling
// @route   GET /api/unread_count
exports.getUnreadCount = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.json({ count: 0 });
        }
        
        const count = await Message.countDocuments({
            receiver: req.session.user.id,
            is_read: false
        });
        
        res.json({ count });
    } catch (error) {
        console.error('Get Unread Count Error:', error);
        res.status(500).json({ count: 0 });
    }
};
