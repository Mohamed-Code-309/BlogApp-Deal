const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['LIKE', 'DISLIKE', 'SAD', 'ANGRY'],
    },
    post: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post'
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment'
    },
    createdBy : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    }
})

const Interaction = mongoose.model('Interaction', InteractionSchema);
module.exports = Interaction;