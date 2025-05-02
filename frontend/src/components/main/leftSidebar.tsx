import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { socket } from '../utils/socketConnector';

type LeftSidebarPropTypes = {
    showLeftSidebar: boolean;
    setShowLeftSidebar: React.Dispatch<React.SetStateAction<boolean>>;
    joinedChatrooms: string[];

}

const LeftSidebarComponent = ({ showLeftSidebar, setShowLeftSidebar, joinedChatrooms }: LeftSidebarPropTypes) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [error, setError] = useState('');
    const [showCreatePopup, setShowCreatePopup] = useState(false);


    useEffect(() => {
        socket?.on('error', (msg) => {
            setError(msg);
            setTimeout(() => {
                setError('')
            }, 5000);
        });
        socket?.on('chatroomCreated', (code) => {
            setShowCreatePopup(false);
            // setSearchParams({ room: code });
            socket?.emit('joinChatroom', code);
        });
    }, [])


    const switchChatroom = (code) => {
        socket?.emit('joinChatroom', code); // Re-fetch messages for the selected chatroom
    };

    const handleJoinChatroom = (e) => {
        e?.preventDefault();
        const roomCode = e?.target?.[0]?.value?.trim();

        if (roomCode) {
            socket?.emit('joinChatroom', roomCode);
            e.target[0].value = ''
        }
    };

    const handleCreateChatroom = (e) => {
        e.preventDefault();
        socket?.emit('createChatroom', { code: e?.target?.[0]?.value?.trim() || null });
    };

    const chatroomCode = searchParams.get("room")

    return (
        <div className={`left-sidebar sm:w-1/5 w-4/5 h-full p-4 sm:border-r border-r-gray-300 shadow-xl bg-white sm:flex flex-col ${showLeftSidebar ? "fixed top-0 left-0 z-20" : "hidden sm:flex"}`}>
            <div className="flex flex-row items-center gap-4 mb-4 text-green-500">
                <span className={`sm:hidden block cursor-pointer text-lg ${showLeftSidebar ? "!block" : ""}`} onClick={() => setShowLeftSidebar(!showLeftSidebar)}>☰</span>
                <h2 className="text-2xl">Chatrooms</h2>
            </div>
            <form onSubmit={handleJoinChatroom} className="mb-4">
                <input
                    type="text"
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
            {showCreatePopup && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create Chatroom</h2>
                        <form onSubmit={handleCreateChatroom}>
                            <input
                                type="text"
                                placeholder="Enter chatroom code"
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
    )
}

export default LeftSidebarComponent;