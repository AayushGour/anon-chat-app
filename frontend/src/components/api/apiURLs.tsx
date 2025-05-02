const BASE_URL = import.meta.env.VITE_APP_API_URL;

export const API_ENDPOINTS = {
    socket: `${BASE_URL}`,
    uploadFile: `${BASE_URL}/upload`,
    uploadedFiles: `${BASE_URL}/uploads`,
}