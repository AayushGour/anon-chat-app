import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ThreeColumnLayoutComponent from './threeColumnLayout';
import LoginComponent from '../pages/loginPage';
import AuthenticatorComponent from '../auth/authenticatorComponent';
import { routeConfig } from '../utils/routeConfig';
import HomePageComponent from '../pages/homePage';

const RouterComponent = () => {
    return (
        <Routes>
            <Route element={<AuthenticatorComponent />}>
                <Route index element={<AuthenticatorComponent />} />
                <Route path={routeConfig.LOGIN.path} element={<LoginComponent />} />
                <Route element={<ThreeColumnLayoutComponent />} >
                    <Route path={routeConfig.HOME.path} element={<HomePageComponent />} />
                </Route>
            </Route>
        </Routes>
    )
}

export default RouterComponent;