const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const chatSocket = require('./sockets/chat');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './Uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    },
});

const chatrooms = new Map(); // Map of chatroom code to { users: [], messages: [] }
const userChatrooms = new Map(); // Map of username to array of chatroom codes
const usernames = new Set(); // Track used usernames

const HOME_CHATROOM = 'home';
chatrooms.set(HOME_CHATROOM, { users: [], messages: [] });

// Initialize Socket.IO logic
chatSocket(io, chatrooms, userChatrooms, usernames, HOME_CHATROOM);

// File upload route with improved error handling
app.post('/upload', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).send(err.message);
        } else if (err) {
            return res.status(400).send('Invalid file type');
        }
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }
        const { username, chatroomCode } = req.body;
        if (chatrooms.has(chatroomCode)) {
            const message = {
                from: username,
                type: 'file',
                fileName: req.file.filename,
                fileType: req.file.mimetype,
                chatroomCode,
                timestamp: new Date().toISOString(),
            };
            chatrooms.get(chatroomCode).messages.push(message);
            io.to(chatroomCode).emit('message', message);
            res.status(200).send('File uploaded');
        } else {
            res.status(400).send('Invalid chatroom');
        }
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
});