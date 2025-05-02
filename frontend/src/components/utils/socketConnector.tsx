import { io } from "socket.io-client";
import { API_ENDPOINTS } from "../api/apiURLs";

export const socket = io(API_ENDPOINTS.socket, {
    autoConnect: true,
    transports: ['websocket'],
    reconnectionAttempts: 5,
})

export const connectSocket = () => {
    socket.connect();
}

export const disconnectSocket = () => {
    socket.disconnect();
}
