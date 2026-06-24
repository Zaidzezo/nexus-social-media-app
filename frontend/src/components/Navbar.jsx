import { Link, useNavigate } from "react-router-dom";
import Searchbar from "./Searchbar";
import { useSocket } from "../context/SocketContext";

const Navbar = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const { totalUnread } = useSocket();

  const handleLogout = () => {
    // Targeted eviction prevents theme settings and layout preferences from dropping out
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    
    // Clean-slate application window context refresh to structural route matrix
    window.location.href = "/login";
  };

  return (
    <nav className="bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center shadow-sm sticky top-0 z-[100]">
      {/* Logo Wrapper context */}
      <div className="flex-shrink-0 min-w-[120px]">
        <Link to="/" className="text-xl font-bold text-blue-600">
          Z
        </Link>
      </div>

      {/* Query Engine Lookup Input component */}
      <div className="flex-1 max-w-md mx-4">
        <Searchbar />
      </div>

      {/* Control Action Links layout row */}
      <div className="flex gap-4 md:gap-6 items-center flex-shrink-0">
        <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium hidden sm:block">
          Feed
        </Link>

        {userId ? (
          <>
            <Link to="/messages" className="relative text-gray-600 hover:text-blue-600 font-medium hidden sm:block">
              Messages
              {totalUnread > 0 && (
                <span className="absolute -top-2 -right-3 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 pointer-events-none">
                  {totalUnread}
                </span>
              )}
            </Link>

            <Link to={`/profile/${userId}`} className="text-gray-600 hover:text-blue-600 font-medium">
              Profile
            </Link>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="text-blue-600 font-semibold">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;