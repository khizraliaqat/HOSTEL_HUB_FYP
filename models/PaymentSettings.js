const mongoose = require('mongoose');

const paymentSettingsSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    jazzcash_name: {
        type: String,
        default: ''
    },
    jazzcash_no: {
        type: String,
        default: ''
    },
    easypaisa_name: {
        type: String,
        default: ''
    },
    easypaisa_no: {
        type: String,
        default: ''
    },
    bank_name: {
        type: String,
        default: ''
    },
    bank_acc_title: {
        type: String,
        default: ''
    },
    bank_iban: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);
