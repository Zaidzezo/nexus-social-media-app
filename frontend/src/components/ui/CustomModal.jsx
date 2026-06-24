import { useEffect } from "react";

const CustomModal = ({ isOpen, onClose, children }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleEscape);
        }

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 dynamic-fade-in"
                onClick={onClose}
            />
            
            {/* Container Window */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all duration-300 z-10 animate-in fade-in zoom-in-95">
                {children}
            </div>
        </div>
    );
};

export default CustomModal;