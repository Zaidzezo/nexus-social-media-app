const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

connectDB();

app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/posts',    require('./routes/postRoutes'));
app.use('/api/users',    require('./routes/userRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling'], 
});

socketHandler(io);

server.listen(5000, () => {
    console.log('Server running on port 5000');
});