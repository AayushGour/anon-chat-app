import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { routeConfig } from '../utils/routeConfig';

const AuthenticatorComponent = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { pathname } = useLocation();
    const roomCode = searchParams.get("room") || null;

    const authenticateUser = () => {
        const username = localStorage.getItem('username');
        if (username) {
            navigate(routeConfig.HOME.path);
        } else {
            navigate(`${routeConfig.LOGIN.path}${roomCode ? `?room=${roomCode}` : ""}`);
        }
    }

    useEffect(() => {
        authenticateUser();
    }, [pathname])

    return (
        <Outlet />
    )
}

export default AuthenticatorComponent;