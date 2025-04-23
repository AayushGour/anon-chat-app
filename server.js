const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost',
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
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

function generateChatroomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.post('/upload', upload.single('file'), (req, res) => {
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

io.on('connection', (socket) => {
    socket.on('login', (username) => {
        if (usernames.has(username)) {
            socket.emit('error', 'Username already taken');
            return;
        }
        usernames.add(username);
        socket.username = username;
        userChatrooms.set(username, []);
        socket.emit('login', username);
        io.emit('users', Array.from(new Set([...userChatrooms.keys()])));
    });

    socket.on('createChatroom', ({ code }) => {
        const chatroomCode = code || generateChatroomCode();
        if (!chatrooms.has(chatroomCode)) {
            chatrooms.set(chatroomCode, { users: [], messages: [] });
            socket.emit('chatroomCreated', chatroomCode);
        } else {
            socket.emit('error', 'Chatroom code already exists');
        }
    });

    socket.on('joinChatroom', (code) => {
        if (chatrooms.has(code)) {
            const userChatroomList = userChatrooms.get(socket.username) || [];
            if (!userChatroomList.includes(code)) {
                userChatroomList.push(code);
                userChatrooms.set(socket.username, userChatroomList);
                chatrooms.get(code).users.push(socket.username);
                socket.join(code);
            }
            socket.emit('chatroomJoined', { code, messages: chatrooms.get(code).messages });
            socket.emit('joinedChatrooms', userChatroomList);
            io.to(code).emit('users', chatrooms.get(code).users);
        } else {
            socket.emit('error', 'Invalid chatroom code');
        }
    });

    socket.on('message', ({ text, chatroomCode }) => {
        if (chatrooms.has(chatroomCode)) {
            const message = { from: socket.username, text, chatroomCode, timestamp: new Date().toISOString() };
            chatrooms.get(chatroomCode).messages.push(message);
            io.to(chatroomCode).emit('message', message);
        }
    });

    socket.on('disconnect', () => {
        const username = socket.username;
        if (username) {
            usernames.delete(username);
            const userChatroomList = userChatrooms.get(username) || [];
            userChatroomList.forEach((code) => {
                if (chatrooms.has(code)) {
                    chatrooms.get(code).users = chatrooms.get(code).users.filter((u) => u !== username);
                    io.to(code).emit('users', chatrooms.get(code).users);
                }
            });
            userChatrooms.delete(username);
            io.emit('users', Array.from(new Set([...userChatrooms.keys()])));
        }
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});