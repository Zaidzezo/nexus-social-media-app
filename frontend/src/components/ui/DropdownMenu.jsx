import { useState, useEffect, useRef } from "react";

const DropdownMenu = ({ trigger, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>

            {isOpen && (
                <div className="absolute right-0 mt-1 w-36 rounded-xl bg-white border border-gray-100 shadow-lg ring-1 ring-black/5 z-20 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-100">
                    {children}
                </div>
            )}
        </div>
    );
};

export default DropdownMenu;