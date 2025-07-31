// types imports
import type { ProfileHeaderProps } from "@/types/props/props-types"

// ui/icon imports
// import { Button } from "@/components/ui/button"
import { User, Users, Dumbbell, MessageSquareText, Settings, UserPlus } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

// component imports
import { ProfileHeaderSkeleton } from "../skeletons/ProfileSkeletons"
import ProfileEditModal from "./ProfileEditModal"
import { useState } from "react"

export default function ProfileHeader({ user, isLoading, isOwnProfile, headerCounts, changeMenuItem }: ProfileHeaderProps) {

    // desktop view
    const [editModalOpen, setEditModalOpen] = useState(false)

    const DesktopHeader = () => (
        <div className="flex items-center bg-white shadow-lg rounded-2xl p-6 h-[180px] w-full relative">
            <div className="absolute top-4 right-4">
                {isOwnProfile ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Settings
                                className="w-6 h-6 text-[var(--accent)] cursor-pointer"
                                onClick={() => setEditModalOpen(true)}
                            />
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-white bg-[var(--accent)]">
                            Profile Settings
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <UserPlus className="w-6 h-6 text-[var(--accent)] cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-white bg-[var(--accent)]">
                            Add Friend
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
            {/* Profile Image */}
            <div className="flex-shrink-0 flex items-center justify-center h-[140px] w-[140px] rounded-xl overflow-hidden mr-6">
                {user?.profile_pic ? (
                    <img
                        src={user.profile_pic}
                        alt={`${user.username}'s profile`}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <User className="h-20 w-20 text-[var(--accent)]" />
                )}
            </div>
            {/* Profile Info */}
            <div className="flex flex-col justify-between h-full flex-1">
                <div>
                    <p className="text-2xl font-bold text-[var(--accent)] mb-2">{user?.username}</p>
                    <p className="text-base text-[var(--subhead-text)]">{user?.bio || "No bio ...yet."}</p>
                </div>
                <div className="flex gap-x-4 mt-4">
                    <div className="flex items-center gap-x-2 hover:cursor-pointer" onClick={() => changeMenuItem && changeMenuItem("friends")}>
                        <Users className="w-5 h-5 text-[var(--accent)]" />
                        <span className="font-bold text-[var(--accent)]">{headerCounts?.friend_count || 0}</span>
                        <span className="text-sm text-[var(--subhead-text)]">Friends</span>
                    </div>
                    <div className="flex items-center gap-x-2 hover:cursor-pointer" onClick={() => changeMenuItem && changeMenuItem("workouts")}>
                        <Dumbbell className="w-5 h-5 text-[var(--accent)]" />
                        <span className="font-bold text-[var(--accent)]">{headerCounts?.workout_count|| 0}</span>
                        <span className="text-sm text-[var(--subhead-text)]">Workouts</span>
                    </div>
                    <div className="flex items-center gap-x-2 hover:cursor-pointer" onClick={() => changeMenuItem && changeMenuItem("posts")}>
                        <MessageSquareText className="w-5 h-5 text-[var(--accent)]" />
                        <span className="font-bold text-[var(--accent)]">{headerCounts?.post_count|| 0}</span>
                        <span className="text-sm text-[var(--subhead-text)]">Posts</span>
                    </div>
                </div>
            </div>
        </div>
    )

    // mobile view
    const MobileHeader = () => (
        <div className="flex flex-col items-center bg-white shadow-lg rounded-xl p-2 w-full h-[130px] relative">
            {/* Top right icon */}
            <div className="absolute top-2 right-2">
                {isOwnProfile ? (
                    <Settings
                        className="w-5 h-5 text-[var(--accent)] cursor-pointer"
                        onClick={() => setEditModalOpen(true)}
                    />
                ) : (
                    <UserPlus className="w-5 h-5 text-[var(--accent)] cursor-pointer" />
                )}
            </div>
            {/* Profile Image + Info + Stats in grid */}
            <div className="grid grid-cols-3 items-center w-full mb-1 h-full">
                {/* Profile Image */}
                <div className="col-span-1 flex items-center justify-center h-full w-full">
                    <div className="h-24 w-24 rounded-xl overflow-hidden flex items-center justify-center">
                        {user?.profile_pic ? (
                            <img
                                src={user.profile_pic}
                                alt={`${user.username}'s profile`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <User className="h-8 w-8 text-[var(--accent)]" />
                        )}
                    </div>
                </div>
                {/* Profile Info + Stats */}
                <div className="col-span-2 ml-1.5 py-3 flex flex-col justify-between h-full">
                    {/* Profile Info */}
                    <div>
                        <p className="font-bold text-[var(--accent)] mb-1.5 w-full leading-tight truncate text-left">{user?.username}</p>
                        <p className="text-xs text-[var(--subhead-text)] w-full leading-tight truncate text-left">{user?.bio || "No bio ...yet."}</p>
                    </div>
                    {/* Stats */}
                    <div className="flex gap-x-2 mt-1">
                        <div className="flex items-center gap-x-1 hover:cursor-pointer" onClick={() => changeMenuItem && changeMenuItem("friends")}>
                            <Users className="size-4 text-[var(--accent)]" />
                            <span className="font-semibold text-[var(--accent)] text-xs">0</span>
                            <span className="text-[10px] text-[var(--subhead-text)]">Friends</span>
                        </div>
                        <div className="flex items-center gap-x-1 hover:cursor-pointer" onClick={() => changeMenuItem && changeMenuItem("workouts")}>
                            <Dumbbell className="size-4 text-[var(--accent)]" />
                            <span className="font-semibold text-[var(--accent)] text-xs">0</span>
                            <span className="text-[10px] text-[var(--subhead-text)]">Workouts</span>
                        </div>
                        <div className="flex items-center gap-x-1 hover:cursor-pointer" onClick={() => changeMenuItem && changeMenuItem("posts")}>
                            <MessageSquareText className="size-4 text-[var(--accent)]" />
                            <span className="font-semibold text-[var(--accent)] text-xs">0</span>
                            <span className="text-[10px] text-[var(--subhead-text)]">Posts</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* loading state */}
            {isLoading && <ProfileHeaderSkeleton />}

            {/* // Only show if isOwnProfile */}
            {isOwnProfile && (
                <ProfileEditModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                />
            )}

            {!isLoading && user &&
                <>
                    <div className="hidden md:block">
                        <DesktopHeader />
                    </div>

                    <div className="md:hidden">
                        <MobileHeader />
                    </div>
                </>
            }
        </>
    )
}
