import { Skeleton } from "@/components/ui/skeleton";

export function ProfileHeaderSkeleton() {
    return (
        <div className="w-full h-[130px] md:h-[180px] rounded-xl p-6 bg-white shadow-lg flex items-center ">
            {/* Profile Image */}
            <Skeleton className="size-24 md:size-[140px] rounded-xl" />

            {/* Profile Info */}
            <div className="flex flex-col justify-between h-full flex-1 ml-4 py-0.5 md:py-4">

                <div>
                    <Skeleton className="h-3 w-24 md:w-48 mb-2" />
                    <Skeleton className="h-3 w-16 md:w-36" />
                </div>

                <div className="flex gap-x-4 mt-4">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-12" />

                </div>
            </div>
        </div>
    );
}

export function ProfileSkeletonMedium() {
    return (
        <div className="flex items-center space-x-6">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
            </div>
        </div>
    );
}

export function ProfileSkeletonLarge() {
    return (
        <div className="flex items-center space-x-8">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-24" />
            </div>
        </div>
    );
}