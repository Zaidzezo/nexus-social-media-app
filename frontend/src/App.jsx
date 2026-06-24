import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import RootLayout from "./components/layouts/RootLayout";
import Feed from "./pages/Feed";
import Account from "./pages/Account";
import Profile from "./pages/Profile";
import Messages from "./pages/MessagesPage";
import PrivateRoute from "./components/PrivateRoute";
import { SocketProvider } from "./context/SocketContext";
import Settings from "./pages/Settings";
import Login from "./pages/Login";      
import Register from "./pages/Register";

function App() {
    return (
        <ThemeProvider>
            <SocketProvider> 
                <Routes>
                    {/* 2. PLUG THEM INTO THE PUBLIC ROUTES HERE 👇 */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Authenticated Application Shell Routes */}
                    <Route element={<PrivateRoute><RootLayout /></PrivateRoute>}>
                        <Route path="/" element={<Feed mode="home" />} />
                        <Route path="/feed" element={<Navigate to="/" replace />} />
                        <Route path="/explore" element={<Feed mode="explore" />} />
                        <Route path="/messages/:conversationId?" element={<Messages />} />
                        <Route path="/account" element={<Account />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile/:id" element={<Profile />} />
                    </Route>

                    {/* Global Wildcard Fallback redirection */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </SocketProvider>
        </ThemeProvider>
    );
}

export default App;