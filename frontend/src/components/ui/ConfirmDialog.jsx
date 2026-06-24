import CustomModal from "./CustomModal";

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
    return (
        <CustomModal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900">{title || "Are you sure?"}</h3>
                <p className="mt-2 text-sm text-gray-500">{message || "This action cannot be undone."}</p>
                
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </CustomModal>
    );
};

export default ConfirmDialog;