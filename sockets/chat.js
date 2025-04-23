module.exports = (io, chatrooms, userChatrooms, usernames, HOME_CHATROOM) => {
    function generateChatroomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    function joinChatroom(socket, chatroomCode) {
        if (chatrooms.has(chatroomCode)) {
            const userChatroomList = userChatrooms.get(socket.username) || [];
            if (!userChatroomList.includes(chatroomCode)) {
                userChatroomList.push(chatroomCode);
                userChatrooms.set(socket.username, userChatroomList);
                chatrooms.get(chatroomCode).users.push(socket.username);
                socket.join(chatroomCode);
                socket.emit('chatroomJoined', { code: chatroomCode, messages: chatrooms.get(chatroomCode).messages });
                socket.emit('joinedChatrooms', userChatroomList);
                io.to(chatroomCode).emit('users', chatrooms.get(chatroomCode).users);
            } else {
                socket.emit('chatroomJoined', { code: chatroomCode, messages: chatrooms.get(chatroomCode).messages });
            }
        } else {
            socket.emit('error', 'Invalid chatroom code');
        }
    }

    io.on('connection', (socket) => {
        socket.on('login', (username) => {
            if (usernames.has(username)) {
                socket.emit('error', 'Username already taken');
                return;
            }
            usernames.add(username);
            socket.username = username;

            // Add user to the home chatroom
            if (!userChatrooms.has(username)) {
                userChatrooms.set(username, []);
            }
            joinChatroom(socket, HOME_CHATROOM);

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
            joinChatroom(socket, code);
        });

        socket.on('message', ({ text, chatroomCode }) => {
            if (chatrooms.has(chatroomCode)) {
                const message = { from: socket.username, text, chatroomCode, timestamp: new Date().toISOString() };
                chatrooms.get(chatroomCode).messages.push(message);
                io.to(chatroomCode).emit('message', message);
            }
        });

        socket.on('typing', ({ chatroomCode }) => {
            if (chatrooms.has(chatroomCode)) {
                socket.to(chatroomCode).emit('typing', socket.username);
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
};