const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    startBid: { type: Number, required: true },
    currentBid: { type: Number, required: true },
    currentBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    endTime: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const Auction = mongoose.model('Auction', auctionSchema);
module.exports = Auction;
