import React, { useState, useEffect, useRef } from 'react';
import CropModal from './CropModal';

const EditProfileModal = ({ isOpen, onClose, userData, onSave }) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [profilePic, setProfilePic] = useState('');
    const [pendingImage, setPendingImage] = useState(null); 
    const [isCropOpen, setIsCropOpen] = useState(false);
    const fileInputRef = useRef(null);

    // Sync state properties whenever the modal triggers open
    useEffect(() => {
        if (userData) {
            setFullName(userData.fullName || '');
            setUsername(userData.username || '');
            setBio(userData.bio || '');
            setProfilePic(userData.profilePic || '');
        }
    }, [userData, isOpen]);

    if (!isOpen) return null;

    // Convert selected image asset to Base64 data string
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPendingImage(reader.result);
                setIsCropOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropSave = (croppedImage) => {
        setProfilePic(croppedImage);
        setIsCropOpen(false);
    };

    // Reverts profile back to utilizing the system initials placeholder
    const handleDeletePhoto = () => {
        setProfilePic('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ fullName, username, bio, profilePic });
    };

    const initialLetter = fullName ? fullName.charAt(0).toUpperCase() : '?';

    return (
        <>
            {/* Crop Modal Component */}
            <CropModal 
                isOpen={isCropOpen} 
                image={pendingImage} 
                onClose={() => setIsCropOpen(false)} 
                onSave={handleCropSave} 
            />

            {/* Main Edit Profile Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                {/* Backdrop element click closer */}
                <div className="absolute inset-0" onClick={onClose} />
                <div className="relative w-full max-w-md bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-100 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto transition-colors duration-200">
                    
                    <h2 className="text-xl font-black text-center text-zinc-900 dark:text-zinc-100 tracking-tight pb-4 border-b border-zinc-200 dark:border-zinc-800/50">
                        Edit Profile
                    </h2> 

                    {/* Hidden File Upload Element */}
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                        className="hidden" 
                    />

                    {/* Avatar Display Section */}
                    <div className="flex flex-col items-center gap-3 my-5">
                        <div className="w-24 h-24 rounded-full bg-blue-600/10 border-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-blue-500 dark:text-blue-400 text-3xl font-black select-none shadow-inner overflow-hidden">
                            {profilePic ? (
                                <img src={profilePic} className="w-full h-full object-cover" alt="Profile Preview" />
                            ) : (
                                initialLetter
                            )}
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700/60 transition active:scale-95"
                            >
                                Change Photo
                            </button>

                            {profilePic && (
                                <button 
                                    type="button"
                                    onClick={handleDeletePhoto}
                                    className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/40 dark:border-red-800/40 text-xs font-bold px-4 py-2 rounded-full transition active:scale-95"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Information Entry Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 pl-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full bg-zinc-50 dark:bg-[#1c1c1f] border border-zinc-200 dark:border-zinc-800 text-sm rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 pl-1">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full bg-zinc-50 dark:bg-[#1c1c1f] border border-zinc-200 dark:border-zinc-800 text-sm rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 pl-1">
                                Bio (Max 6 lines)
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
                                maxLength={200}
                                className="w-full bg-zinc-50 dark:bg-[#1c1c1f] border border-zinc-200 dark:border-zinc-800 text-sm rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none leading-relaxed"
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        {/* Form Submissions Buttons */}
                        <div className="flex gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800/50 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold py-3 px-4 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700/40 transition active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 text-sm rounded-xl transition shadow-lg shadow-blue-600/10 active:scale-[0.98]"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default EditProfileModal;