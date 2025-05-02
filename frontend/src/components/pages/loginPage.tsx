import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { routeConfig } from '../utils/routeConfig';
import { socket } from '../utils/socketConnector';

const LoginComponent = () => {
    const [error, setError] = useState('');
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate();

    useEffect(() => {
        socket?.on('login', (username) => {
            localStorage.setItem("username", username);
            const room = searchParams.get("room") || "home";
            navigate(`${routeConfig.HOME.path}?room=${room}`);
        })
        socket?.on('error', (msg) => {
            setError(msg);
        });
    }, [])


    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        const usernameVal = e?.target?.[0]?.value?.trim();
        if (usernameVal) {
            socket?.emit('login', usernameVal);
        }
        setError('');
    }

    return (
        <div className="h-full w-full login-page flex flex-col items-center justify-center ">
            <form onSubmit={handleLogin} className="login-form shadow-2xl rounded-2xl sm:p-16 p-8 border border-gray-300">
                <h1 className="text-2xl sm:text-3xl md:text-4xl mb-10 text-green-500">Welcome to Chatrooms</h1>
                <input
                    type="text"
                    // value={usernameInput}
                    // onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter username"
                    className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition">
                    Login
                </button>
                {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
            </form>
        </div>
    )
}

export default LoginComponent;