export default function SkeletonCard() {
    return (
        <div className="h-full border border-slate-200 rounded-xl p-6 bg-white shadow-sm animate-pulse flex flex-col justify-between">
            <div>
                <div className="h-6 bg-slate-200 rounded w-2/3 mb-4"></div>
                <div className="space-y-2 mb-6">
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-100 rounded w-4/6"></div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div className="h-6 bg-blue-50 rounded-full w-32"></div>
                <div className="h-4 bg-slate-200 rounded w-20"></div>
            </div>
        </div>
    );
}
