import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from '../api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: ""
  });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", formData);
      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  // Human-readable mapping context placeholder dictionary
  const placeholders = {
    fullName: "Full Name",
    username: "Username",
    email: "Email Address",
    password: "Password"
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4 transition-colors duration-200">
      <form onSubmit={handleRegister} className="w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 p-8 shadow-lg border border-gray-100 dark:border-zinc-800">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800 dark:text-zinc-100">Create Account</h2>
        
        {['fullName', 'username', 'email', 'password'].map((field) => (
          <input
            key={field}
            type={field === 'password' ? 'password' : 'text'}
            placeholder={placeholders[field]}
            className="mb-4 w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent p-3 outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-zinc-100 placeholder-gray-400"
            value={formData[field]}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            required
          />
        ))}
        
        <button 
          type="submit" 
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-500/10"
        >
          Register
        </button>

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-zinc-400">
            Already have an account?{" "} 
            <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Login here
            </Link>
        </div>
      </form>
    </div>
  );
};

export default Register;