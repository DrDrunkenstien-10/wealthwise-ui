import axios from "axios";
import keycloak from "../keycloak";

const axiosInstance = axios.create({
    baseURL: "https://api.wealthwise.ajadhav.com/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

axiosInstance.interceptors.request.use(
    async (config) => {
        if (!keycloak.authenticated) {
            throw new axios.Cancel("User not authenticated");
        }

        try {
            // Refresh token if it expires in less than 5 seconds
            await keycloak.updateToken(5);
            config.headers.Authorization = `Bearer ${keycloak.token}`;
        } catch (err) {
            console.error("🔒 Token refresh failed:", err);
            throw new axios.Cancel("Token refresh failed");
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;