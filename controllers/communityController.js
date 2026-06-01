const CommunityMessage = require('../models/CommunityMessage');
const mongoose = require('mongoose');

// @desc    Show community page
// @route   GET /community
exports.getCommunity = (req, res) => {
    res.render('community');
};

// @desc    Show area chat
// @route   GET /area_chat
exports.getAreaChat = (req, res) => {
    const area = req.query.area || 'General';
    res.render('area_chat', { area });
};

// @desc    Community API (send/fetch messages)
// @route   POST /api_community
exports.communityAPI = async (req, res) => {
    try {
        const { action, area, message } = req.body || {};

        if (!action || !area) {
            return res.status(400).json({ status: 'error', message: 'Bad Request' });
        }

        if (action === 'send') {
            if (!req.session.user) {
                return res.status(401).json({
                    status: 'login_required',
                    message: 'Login is required to send messages.'
                });
            }

            const cleanMessage = String(message || '').trim();
            if (!cleanMessage) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Message cannot be empty.'
                });
            }

            await CommunityMessage.create({
                area_name: area,
                sender: new mongoose.Types.ObjectId(String(req.session.user.id)),
                message: cleanMessage
            });

            return res.json({ status: 'sent' });
        } else if (action === 'fetch') {
            const messages = await CommunityMessage.find({ area_name: area })
                .populate('sender', 'name')
                .sort({ createdAt: 1 })
                .lean();

            // Parse guest messages
            const parsedMessages = messages.map(msg => {
                let displayName = msg.sender ? msg.sender.name : 'Guest';
                let displayMessage = msg.message;

                // Check if it's a guest message format [Name] message
                if (displayName === 'Guest' && msg.message && msg.message.startsWith('[')) {
                    const endIndex = msg.message.indexOf(']');
                    if (endIndex > 1) {
                        displayName = msg.message.substring(1, endIndex);
                        displayMessage = msg.message.substring(endIndex + 1).trim();
                    }
                }

                return {
                    name: displayName,
                    message: displayMessage,
                    sender_id: msg.sender ? String(msg.sender._id) : null,
                    createdAt: msg.createdAt,
                    created_at: msg.createdAt // For backward compatibility
                };
            });

            return res.json(parsedMessages);
        } else {
            return res.status(400).json({ status: 'error', message: 'Bad Request' });
        }
    } catch (error) {
        console.error('Community API Error:', error);
        res.status(500).json({ status: 'error', message: 'Error processing community message' });
    }
};
