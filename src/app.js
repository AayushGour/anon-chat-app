const { useState, useEffect, useRef } = React;
const { BrowserRouter, Routes, Route } = window.ReactRouterDOM;

const apiUrl = REACT_APP_API_URL

const App = () => {
    const [user, setUser] = useState(localStorage.getItem("username") || null);
    const [usernameInput, setUsernameInput] = useState('');
    const [chatroomCode, setChatroomCode] = useState('');
    const [joinedChatrooms, setJoinedChatrooms] = useState(["home"]);
    const [joinCode, setJoinCode] = useState('');
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [showUploadPanel, setShowUploadPanel] = useState(false);
    const [newChatroomCode, setNewChatroomCode] = useState('');
    const [error, setError] = useState('');
    const [socket, setSocket] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);

    const messsagesContainerRef = useRef();

    useEffect(() => {
        const newSocket = io(apiUrl);
        setSocket(newSocket);

        newSocket.on('login', (username) => {
            localStorage.setItem("username", username);
            setUser(username);
        });

        newSocket.on('users', (userList) => {
            setUsers(userList);
        });

        newSocket.on('message', (msg) => {
            setMessages((prev) => [...prev, msg]);
            setTimeout(() => {
                messsagesContainerRef.current.scrollTop = messsagesContainerRef.current.scrollHeight || 99999;
            }, 10)
        });

        newSocket.on('chatroomCreated', (code) => {
            setShowCreatePopup(false);
            setNewChatroomCode('');
            setJoinCode(code);
            newSocket.emit('joinChatroom', code);
        });

        newSocket.on('chatroomJoined', ({ code, messages }) => {
            setJoinedChatrooms((prev) => [...new Set([...prev, code])]);
            setJoinCode("")
            setChatroomCode(code);
            setMessages(messages);
            setError('');
            setTimeout(() => {
                messsagesContainerRef.current.scrollTop = messsagesContainerRef.current.scrollHeight || 99999;
            }, 10)
        });

        newSocket.on('joinedChatrooms', (chatrooms) => {
            setJoinedChatrooms(chatrooms);
        });

        newSocket.on('error', (msg) => {
            setError(msg);
        });
        if (localStorage.getItem("username")) {
            console.log("some")
            handleLogin()
        }
        return () => newSocket.disconnect();
    }, []);

    const handleLogin = (e) => {
        if (e) e.preventDefault();
        if (usernameInput.trim()) {
            socket.emit('login', usernameInput);
        }
    };

    const handleJoinChatroom = (e) => {
        e.preventDefault();
        if (joinCode.trim()) {
            socket.emit('joinChatroom', joinCode);
        }
    };

    const handleCreateChatroom = (e) => {
        e.preventDefault();
        socket.emit('createChatroom', { code: newChatroomCode.trim() || null });
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.size <= 5 * 1024 * 1024) {
            setFile(selectedFile);
            setError('');
        } else {
            setError('File size must be less than 5MB');
        }
    };

    const clearFile = () => {
        setFile(null);
        document.getElementById("file-upload-input").value = "";
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (chatroomCode) {
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('username', user);
                formData.append('chatroomCode', chatroomCode);
                try {
                    const response = await fetch(`${apiUrl}/upload`, {
                        method: 'POST',
                        body: formData,
                    });
                    if (!response.ok) {
                        setError('Failed to upload file');
                    }
                    setFile(null);
                    setShowUploadPanel(false);
                    clearFile()
                } catch (err) {
                    console.error(err)
                    setError('Error uploading file');
                }
            }
            if (message.trim()) {
                socket.emit('message', { text: message, chatroomCode });
                setMessage('');
            }
        }
    };

    const switchChatroom = (code) => {
        setChatroomCode(code);
        socket.emit('joinChatroom', code); // Re-fetch messages for the selected chatroom
    };

    if (!user) {
        return (
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <div className="flex items-center justify-center h-screen bg-gray-100">
                                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                                    <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
                                    <form onSubmit={handleLogin}>
                                        <input
                                            type="text"
                                            value={usernameInput}
                                            onChange={(e) => setUsernameInput(e.target.value)}
                                            placeholder="Enter username"
                                            className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition">
                                            Login
                                        </button>
                                        {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
                                    </form>
                                </div>
                            </div>
                        }
                    />
                </Routes>
            </BrowserRouter>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <div className="flex flex-col sm:flex-row h-screen bg-gray-100">
                            <div className={`left-sidebar w-full sm:w-1/4 bg-white border-r sm:border-r sm:min-h-screen overflow-y-auto shadow-lg ${showSidebar ? "fixed top-0 left-0 z-20" : "hidden sm:block"}`}>
                                <div className="p-4">
                                    <div class="flex flex-row items-center gap-2 mb-4">
                                        <span className={`sm:hidden block cursor-pointer ${showSidebar ? "!block" : ""}`} onClick={() => setShowSidebar(!showSidebar)}>☰</span>
                                        <h2 className="text-xl font-bold">Chatrooms</h2>
                                    </div>
                                    <form onSubmit={handleJoinChatroom} className="mb-4">
                                        <input
                                            type="text"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value)}
                                            placeholder="Enter chatroom code"
                                            className="w-full p-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition">
                                            Join Chatroom
                                        </button>
                                    </form>
                                    <button
                                        onClick={() => setShowCreatePopup(true)}
                                        className="w-full bg-blue-500 text-white p-2 rounded mb-4 hover:bg-blue-600 transition"
                                    >
                                        Create Chatroom
                                    </button>
                                    <h3 className="text-lg font-semibold mb-2">Joined Chatrooms</h3>
                                    <ul className="chatroom-list max-h-64 sm:max-h-[calc(100vh-16rem)] overflow-y-auto">
                                        {joinedChatrooms.map((code) => (
                                            <li
                                                key={code}
                                                onClick={() => switchChatroom(code)}
                                                className={`p-2 cursor-pointer rounded ${chatroomCode === code ? 'bg-gray-200' : 'hover:bg-gray-100'
                                                    } transition`}
                                            >
                                                {code}
                                            </li>
                                        ))}
                                    </ul>
                                    {error && <p className="text-red-500 mt-2">{error}</p>}
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col relative h-full">
                                <div className="bg-green-500 text-white p-4 flex flex-row justify-between">
                                    <span className="sm:hidden block cursor-pointer" onClick={() => setShowSidebar(!showSidebar)}>☰</span>
                                    <h2 className="text-lg font-bold">
                                        {chatroomCode ? `Chatroom: ${chatroomCode}` : 'Join a chatroom'}
                                    </h2>
                                    <h2 className="text-lg font-bold">
                                        {user ? user : ''}
                                    </h2>
                                </div>
                                <div ref={messsagesContainerRef} className="flex-1 p-4 overflow-y-auto messages-container">
                                    {messages
                                        .filter((msg) => msg.chatroomCode === chatroomCode)
                                        .map((msg, index) => (
                                            <div
                                                key={index}
                                                className={`mb-3 ${msg.from === user ? 'text-right' : 'text-left'}`}
                                            >
                                                <div
                                                    className={`inline-flex flex-col gap-1 p-3 rounded-lg ${msg.from === user ? 'bg-green-200' : 'bg-gray-200'
                                                        } max-w-[80%] sm:max-w-[60%]`}
                                                >
                                                    <strong>{msg.from}</strong>
                                                    {msg.type === 'file' ? (
                                                        msg.fileType.startsWith('image/') ? (
                                                            <img
                                                                src={`${apiUrl}/uploads/${msg.fileName}`}
                                                                alt="Uploaded"
                                                                className="max-w-full sm:max-w-xs rounded"
                                                            />
                                                        ) : (
                                                            <a
                                                                href={`${apiUrl}/uploads/${msg.fileName}`}
                                                                download
                                                                className="text-blue-500 underline"
                                                            >
                                                                {msg.fileName}
                                                            </a>
                                                        )
                                                    ) : (
                                                        msg.text
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                                {chatroomCode && (
                                    <div className="p-4 bg-white border-t relative">
                                        <form onSubmit={sendMessage} className="flex flex-row sm:flex-row sm:items-center gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="Type a message"
                                                className="message-input flex-1 p-2 border rounded sm:rounded-l focus:outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowUploadPanel(true)}
                                                    className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition text-3xl"
                                                >
                                                    📎
                                                </button>
                                                <button type="submit" className="bg-green-500 text-white p-2 rounded sm:rounded-r hover:bg-green-600 transition">
                                                    Send
                                                </button>
                                            </div>
                                        </form>
                                        <div
                                            className={`upload-panel h-48 fixed absolute bottom-0 left-0 right-0 bg-white shadow-lg p-6 rounded-t-lg sm:rounded-lg sm:-top-48 sm:left-auto sm:right-auto sm:w-96 sm:right-4 transition-transform ${showUploadPanel ? 'open sm:-top-48' : 'sm:top-0 hidden'
                                                }`}
                                        >
                                            <h3 className="text-lg font-semibold mb-4">Upload File</h3>
                                            {file ? (
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-sm truncate">{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={clearFile}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="inline-block bg-green-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-600 transition mb-4">
                                                    Choose File
                                                    <input
                                                        id="file-upload-input"
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/gif,application/pdf,.doc,.docx,.txt"
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                            )}
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowUploadPanel(false)}
                                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                                                >
                                                    Close
                                                </button>
                                                {file && (
                                                    <button
                                                        type="button"
                                                        onClick={sendMessage}
                                                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                                                    >
                                                        Upload
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {showCreatePopup && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                                        <h2 className="text-xl font-bold mb-4">Create Chatroom</h2>
                                        <form onSubmit={handleCreateChatroom}>
                                            <input
                                                type="text"
                                                value={newChatroomCode}
                                                onChange={(e) => setNewChatroomCode(e.target.value)}
                                                placeholder="Enter chatroom code (optional)"
                                                className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCreatePopup(false)}
                                                    className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition"
                                                >
                                                    Cancel
                                                </button>
                                                <button type="submit" className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition">
                                                    Create
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);