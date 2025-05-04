import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { socket } from '../utils/socketConnector';
import { routeConfig } from '../utils/routeConfig';
import { API_ENDPOINTS } from '../api/apiURLs';

const HomePageComponent = () => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [showUploadPanel, setShowUploadPanel] = useState(false);
    const [message, setMessage] = useState('')

    const [searchParams, setSearchParams] = useSearchParams();
    const { messages } = useOutletContext();
    const messsagesContainerRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();
    const user = localStorage.getItem('username') || null;
    const roomCode = searchParams.get("room");

    useEffect(() => {
        if (messsagesContainerRef?.current) {
            setTimeout(() => {
                messsagesContainerRef.current.scrollTop = messsagesContainerRef.current?.scrollHeight || 99999;
            }, 10)
        }
    }, [messages])

    useEffect(() => {
        if (!!user && !roomCode) {
            socket.emit('login', user)
        } else if (user && roomCode) {
            socket?.emit('joinChatroom', roomCode);
        } else {
            navigate(`${routeConfig.LOGIN.path}${roomCode ? `?room=${roomCode}` : ""}`)
        }
        return () => {
            setError("")
        }
    }, [searchParams])

    // useEffect(() => {
    //     console.log(user, roomCode)
    //     if (roomCode) {
    //         socket?.emit('joinChatroom', roomCode);
    //     }
    // }, [searchParams])



    const clearFile = () => {
        setFile(null);
        const inputElem = document.getElementById("file-upload-input");
        if (inputElem) inputElem.value = "";
    };
    const sendMessage = async (e) => {
        e.preventDefault();
        if (roomCode) {
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('username', user);
                formData.append('chatroomCode', roomCode);
                try {
                    const response = await fetch(`${API_ENDPOINTS.uploadFile}`, {
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
                socket.emit('message', { text: message, chatroomCode: roomCode });
                setMessage('');
            }
        }
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



    return (
        <div className="w-full h-full home-page flex flex-col gap-2 p-4">
            <div ref={messsagesContainerRef} className="flex-1 p-4 overflow-y-auto messages-container">
                {messages
                    .filter((msg) => msg.chatroomCode === roomCode)
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
                                            src={`${API_ENDPOINTS.uploadedFiles}/${msg.fileName}`}
                                            alt="Uploaded"
                                            className="max-w-full sm:max-w-xs rounded"
                                        />
                                    ) : (
                                        <a
                                            href={`${API_ENDPOINTS.uploadedFiles}/${msg.fileName}`}
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
            {roomCode && (
                <div className="bg-white relative">
                    <form onSubmit={sendMessage} className="flex flex-row sm:flex-row sm:items-center gap-2 mb-2 p-4 overflow-hidden w-full">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message"
                            className="message-input flex-1 p-2 border rounded sm:rounded-l focus:outline-none focus:ring-2 focus:ring-green-500 min-w-1/2"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowUploadPanel(true)}
                                className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition text-3xl"
                            >
                                <span className="material-symbols-outlined text-lg">
                                    attach_file
                                </span>
                            </button>
                            <button type="submit" className="bg-green-500 text-white p-2 rounded sm:rounded-r hover:bg-green-600 transition">
                                Send
                            </button>
                        </div>
                    </form>
                    <div
                        className={`upload-panel h-48 flex flex-col gap-2 absolute bottom-0 left-0 right-0 bg-white shadow-lg p-6 rounded-t-lg sm:rounded-lg sm:-top-48 sm:left-auto sm:w-96 sm:right-4 transition-transform ${showUploadPanel ? 'open sm:-top-48' : 'sm:top-0 hidden'
                            }`}
                    >
                        <h3 className="text-lg font-semibold mb-4">Upload File</h3>
                        {file ? <span className="text-sm truncate mb-4">{file?.name}</span> : <></>}
                        <div className="flex justify-end gap-2">
                            {file ? (
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={clearFile}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <label className="inline-block bg-green-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-600 transition">
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
    )
}

export default HomePageComponent;