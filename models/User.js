const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['USER', 'ADMIN'],
        default: "USER"
    }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;