import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { routeConfig } from '../utils/routeConfig';
import { socket } from '../utils/socketConnector';
import LeftSidebarComponent from './leftSidebar';
import RightSidebarComponent from './rightSidebar';

const ThreeColumnLayoutComponent = () => {
    const [joinedChatrooms, setJoinedChatrooms] = useState(["home"]);
    const [showLeftSidebar, setShowLeftSidebar] = useState(false);
    const [showRightSidebar, setShowRightSidebar] = useState(false);
    const [messages, setMessages] = useState([]);

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();


    useEffect(() => {
        socket?.on('chatroomJoined', ({ code, messages }) => {
            setJoinedChatrooms((prev) => [...new Set([...prev, code])]);
            // setJoinCode("")
            // setChatroomCode(code);
            setSearchParams({ room: code })
            setMessages(messages);
            // setError('');
            // setTimeout(() => {
            //     messsagesContainerRef.current.scrollTop = messsagesContainerRef.current.scrollHeight || 99999;
            // }, 10)
        });

        socket?.on('joinedChatrooms', (chatrooms) => {
            setJoinedChatrooms(chatrooms);
        });
        socket.on('message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });
    }, [])

    const handleLogout = () => {
        socket.emit('logout', localStorage.getItem('username'));
        localStorage.clear();
        navigate(routeConfig.LOGIN.path)
    }
    const roomCode = searchParams.get("room") || null;
    return (
        <div className="flex flex-row w-full h-full overflow-hidden">
            <LeftSidebarComponent
                showLeftSidebar={showLeftSidebar}
                setShowLeftSidebar={setShowLeftSidebar}
                joinedChatrooms={joinedChatrooms}
            />
            <div className="h-full flex-1 overflow-hidden flex flex-col">
                <div className="app-header w-full min-h-16 px-4 py-2 bg-green-500 text-white flex items-center justify-between">
                    <span title='Menu' className="material-symbols-outlined text-lg sm:!hidden block cursor-pointer" onClick={() => setShowLeftSidebar(!showLeftSidebar)}>
                        menu
                    </span>
                    <span className="text-2xl text-start">{roomCode ? `Chatroom: ${roomCode}` : "Chatrooms"}</span>
                    <div className="flex flex-row items-center gap-4">
                        <span title='Show Users' className="material-symbols-outlined text-lg sm:!hidden block cursor-pointer" onClick={() => setShowRightSidebar(!showRightSidebar)}>
                            group
                        </span>
                        <span title='Share' className="material-symbols-outlined text-lg">
                            share
                        </span>
                        <span className="material-symbols-outlined text-lg cursor-pointer" onClick={handleLogout}>
                            logout
                        </span>
                    </div>
                </div>
                <div className="flex flex-row w-full flex-1 relative overflow-hidden">
                    <div className="main-content flex-grow"><Outlet context={{ messages }} /></div>
                    <RightSidebarComponent showRightSidebar={showRightSidebar} setShowRightSidebar={setShowRightSidebar} />
                </div>
            </div>
        </div>
    )
}

export default ThreeColumnLayoutComponent;