import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from '../api';

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const res = await api.post('/auth/login', { identifier, password });
        
        localStorage.setItem('token', res.data.token);
        localStorage.setItem("userId", res.data.userId);
        navigate('/');
        window.location.reload();
    } catch (err) {
        console.error("Login failed:", err);
        alert(err.response?.data?.message || "Invalid credentials provided");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4 transition-colors duration-200">
      <form 
        onSubmit={handleLogin} 
        className="w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 p-8 shadow-lg border border-gray-100 dark:border-zinc-800"
      >
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800 dark:text-zinc-100">Login</h2>
        
        <input
          type="text" 
          placeholder="Email or Username" 
          className="mb-4 w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent p-3 outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-zinc-100 placeholder-gray-400"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}r
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          className="mb-6 w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent p-3 outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-zinc-100 placeholder-gray-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button 
          type="submit" 
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-500/10"
        >
          Sign In
        </button>

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-zinc-400">
            Don't have an account?{" "} 
            <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Register here
            </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;