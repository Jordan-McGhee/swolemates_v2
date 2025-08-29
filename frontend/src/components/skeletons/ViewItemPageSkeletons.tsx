import { Skeleton } from "../ui/skeleton";

export function ViewItemPageSkeleton() {
    return (
        <div className="w-full max-w-4xl mx-auto p-4 bg-[var(--white)] rounded-xl md:p-6 lg:p-8">
            <div className="">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-24 md:w-32" />
                </div>

                {/* Title Section */}
                <div className="mt-6 mb-4">
                    <Skeleton className="h-8 w-3/4 md:w-1/2" />

                </div>

                {/* Content Section */}
                <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>

                {/* Interaction Section */}
                <div className="flex items-center gap-6 my-4">
                    <Skeleton className="h-8 w-10" />
                    <Skeleton className="h-8 w-10" />
                </div>

                {/* Comments Section */}
                <div className="space-y-4">

                    {[...Array(3)].map((_, idx) => (
                        <div key={idx} className="flex items-start gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function ViewItemPageSidebarSkeleton() {
    return (
        <div className="w-full max-w-xs p-4 bg-[var(--white)] rounded-xl mx-auto mt-4 lg:mt-0">
            <div className="space-y-4">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-32" />
            </div>
        </div>
    );
}