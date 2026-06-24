const ProfileAvatar = ({ user, size = "w-10 h-10", textSize = "text-sm" }) => {
    if (user?.profilePic) {
        return (
            <img 
                src={user.profilePic} 
                alt={user.fullName} 
                className={`${size} rounded-full object-cover shadow-sm border border-gray-100`}
            />
        );
    }
    return (
        <div className={`${size} bg-blue-600 rounded-full flex items-center justify-center text-white ${textSize} font-bold shadow-sm`}>
            {user?.fullName?.charAt(0).toUpperCase() || "?"}
        </div>
    );
};

export default ProfileAvatar;