import React, { useEffect, useState } from 'react';
import { socket } from '../utils/socketConnector';

type RightSidebarPropTypes = {
    showRightSidebar: boolean;
    setShowRightSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const RightSidebarComponent = ({ showRightSidebar, setShowRightSidebar }: RightSidebarPropTypes) => {
    const [usersList, setUsersList] = useState<string[]>([])
    useEffect(() => {
        socket.on("users", (userList) => {
            setUsersList(userList)
        })
    }, [])

    return (
        <div className={`right-sidebar bg-gray-200 p-4 sm:w-1/4 h-full border-l border-l-gray-500 ${showRightSidebar ? "absolute top-0 right-0 z-20 w-1/3" : "hidden sm:flex"}`}>
            <div className="users-list-container flex flex-col w-full h-full rounded-lg gap-2">
                {usersList?.length > 0 ? usersList?.map((user) => {
                    return <div className='user-item flex flex-row items-center justify-start gap-2 bg-white p-2 rounded-lg'>
                        <span className="material-symbols-outlined">
                            account_circle
                        </span>
                        <span className='wrap-anywhere'>{user}</span>
                    </div>
                }) : <>No Users Available</>}
            </div>
        </div>
    )
}

export default RightSidebarComponent;