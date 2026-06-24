import { Link } from "react-router-dom";
import ProfileAvatar from "./ProfileAvatar";

const FollowModal = ({ isOpen, onClose, title, users, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Main Container Card */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/60 rounded-xl w-full max-w-sm max-h-[70vh] overflow-hidden flex flex-col transition-colors shadow-2xl">
        
        {/* Modal Top Header Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800/60 flex justify-between items-center">
          <h2 className="font-extrabold text-lg text-slate-900 dark:text-zinc-50">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-100 font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Results Pane */}
        <div className="overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length > 0 ? (
            users.map((u) => (
              <Link
                to={`/profile/${u._id}`}
                key={u._id}
                onClick={onClose}
                className="flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-lg transition group"
              >
                <ProfileAvatar user={u} size="w-10 h-10" />
                <div className="truncate">
                  <p className="font-bold text-sm text-slate-900 dark:text-zinc-200 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                    {u.fullName}
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold">
                    @{u.username}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-center py-6 text-sm font-medium text-slate-400 dark:text-zinc-500">
              No one here yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowModal;