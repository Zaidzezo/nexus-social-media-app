import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true, 
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// REQUEST INTERCEPTOR — Attach active authentication tokens smoothly
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));


// RESPONSE INTERCEPTOR — Queue execution parsing on 401 response challenges
api.interceptors.response.use(
    (response) => response, 
    async (error) => {
        const originalRequest = error.config;

        const is401 = error.response?.status === 401;
        const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh');
        const alreadyRetried = originalRequest._retry;

        if (is401 && !isRefreshEndpoint && !alreadyRetried) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true; 
            isRefreshing = true;

            try {
                const { data } = await api.post('/auth/refresh');
                
                localStorage.setItem('token', data.token);
                
                originalRequest.headers.Authorization = `Bearer ${data.token}`;
                processQueue(null, data.token);
                
                return api(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                
                window.location.href = '/login'; 
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;