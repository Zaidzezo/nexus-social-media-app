const SkeletonCard = () => {
    return (
        <div className="border border-gray-100 rounded-2xl p-5 bg-white space-y-4 animate-pulse w-full">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-2 bg-gray-200 rounded w-1/6" />
                </div>
            </div>
            <div className="space-y-2 pt-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
            <div className="h-48 bg-gray-200 rounded-xl w-full pt-2" />
        </div>
    );
};

export default SkeletonCard;