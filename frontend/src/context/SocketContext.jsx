import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);
    
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    
    useEffect(() => {
        const handleStorageChange = () => {
            const currentToken = localStorage.getItem('token');
            if (currentToken !== token) {
                setToken(currentToken);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', handleStorageChange);
        
        const interval = setInterval(handleStorageChange, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleStorageChange);
            clearInterval(interval);
        };
    }, [token]);

    useEffect(() => {
        console.log('attempting socket connection with token:', token);
        
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        }

        if (!token) {
            console.log('No token found, skipping socket connection');
            return;
        }

        // Automatically strips out the '/api' suffix if VITE_API_URL contains it, ensuring Socket.io connects to the root domain
        const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const socketUrl = rawUrl.endsWith('/api') ? rawUrl.replace(/\/api$/, '') : rawUrl;

        const socket = io(
            socketUrl,
            {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 5,
                reconnectionDelay: 2000,
                forceNew: true, 
            }
        );

        socketRef.current = socket;

        socket.on('connect',    () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('new_message_notification', () => {
            setTotalUnread(prev => prev + 1);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [token]); 
    
    const emit = useCallback((event, ...args) => {
        socketRef.current?.emit(event, ...args);
    }, []);

    const on = useCallback((event, handler) => {
        socketRef.current?.on(event, handler);
    }, []);

    const off = useCallback((event, handler) => {
        socketRef.current?.off(event, handler);
    }, []);

    const clearUnread = useCallback(() => setTotalUnread(0), []);

    return (
        <SocketContext.Provider value={{ emit, on, off, isConnected, totalUnread, clearUnread }}>
            {children}
        </SocketContext.Provider>
    );
};