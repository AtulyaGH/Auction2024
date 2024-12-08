const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const User = require('./models/User');
const Auction = require('./models/Auction');
const authMiddleware = require('./middleware/auth');

const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};


app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve socket.io client library from socket.io-client package
app.get('../node_modules/socket.io-client/dist/socket.io.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules', 'socket.io-client', 'dist', 'socket.io.js'));
});

mongoose.connect('mongodb://localhost:27017/mydatabase', { useNewUrlParser: true, useUnifiedTopology: true });

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const role = 'client';

    if (!username || !password) {
        return res.status(400).send('Missing fields');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role });
    await user.save();
    res.status(201).send('User registered');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).send('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send('Invalid credentials');

    const token = jwt.sign({ id: user._id, role: user.role }, 'secretKey');
    res.json({ token, role: user.role });
});

app.post('/create-admin', authMiddleware(['admin']), async (req, res) => {
    const { username, password } = req.body;
    const role = 'admin';

    if (!username || !password) {
        return res.status(400).send('Missing fields');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({ username, password: hashedPassword, role });
    await admin.save();
    res.status(201).send('Admin registered');
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('createAuction', async (data) => {
        const { title, description, startBid, endTime } = data;
        const auction = new Auction({
            title,
            description,
            startBid,
            endTime,
            currentBid: startBid
        });
        await auction.save();
        io.emit('newAuction', auction);
    });

    socket.on('placeBid', async (data) => {
        const { auctionId, bidAmount, userId } = data;
        const auction = await Auction.findById(auctionId);

        if (auction && bidAmount > auction.currentBid) {
            auction.currentBid = bidAmount;
            auction.currentBidder = userId;
            await auction.save();
            io.emit('updateBid', auction);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(3000, '0.0.0.0', () => console.log('Server running on port 3000'));
