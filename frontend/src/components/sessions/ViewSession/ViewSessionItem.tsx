import React, { useState } from "react";
import { Link } from "react-router-dom";

// ui imports
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// component imports
import LikeCommentButtons from "@/components/ui/like-comment-buttons";
import AddCommentForm from "@/components/comments/AddCommentForm";
import CommentItem from "@/components/comments/CommentItem";

// type imports
import { ViewSessionItemProps, Like } from "@/types/props/props-types";

// util imports
import { formatDate } from "@/util/general-util";

// hook import
import { useAuth } from "@/context/AuthProvider";

const ViewSessionItem: React.FC<ViewSessionItemProps> = ({ session, liked, likes, likeCount, comments, commentCount, onLikeToggle, onCommentAdded }) => {

    // hook destructuring
    const { user: authUser, token } = useAuth();

    // mobile drawer state
    const searchParams = new URLSearchParams(window.location.search);
    const [drawerOpen, setDrawerOpen] = useState(searchParams.get("show") === "likes");


    return (
        <>
            {
                session &&
                <Card className="bg-[var(--white)] shadow-lg text-left text-[var(--subhead-text)]">
                    <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">

                        {/* user avatar and name */}
                        <div className="flex flex-row items-center">
                            <div className="flex items-center gap-3">
                                <Avatar className="size-8 rounded-md">
                                    {session.profile_pic ? (
                                        <AvatarImage src={session.profile_pic} alt={session.username} />
                                    ) : (
                                        <AvatarFallback>
                                            {session.username}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div className="text-left">
                                    <p>
                                        <Link to={`/user/${session.username}`} className="font-medium text-[var(--accent)] hover:underline">
                                            {session.username}
                                        </Link>
                                        's session
                                    </p>
                                    <p className="text-sm text-[var(--subhead-text)]">
                                        {formatDate(session.created_at, "shortTime")}
                                        {session.updated_at !== session.created_at && (
                                            <>
                                                {" | "}
                                                <span className="italic">Edited {formatDate(session.updated_at, "relative")}</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* session options */}
                        {authUser && (
                            <DropdownMenu>
                                <DropdownMenuTrigger className="p-2 rounded-full hover:bg-[var(--off-bg)] transition">
                                    <EllipsisVertical size={20} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuLabel>Session Options</DropdownMenuLabel>
                                    <DropdownMenuItem>
                                        <Link
                                            to={`/sessions/${session.session_id}/edit`}
                                            className="w-full h-full block"
                                        >
                                            Edit Session
                                        </Link>
                                    </DropdownMenuItem>
                                    {authUser.user_id === session.user_id && (
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onClick={() => {
                                                toast.error("Delete session functionality not implemented.");
                                            }}
                                        >
                                            Delete Session
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2 mb-4">

                            {/* workout and session info */}
                            <div className="flex flex-col gap-2 w-full">
                                <Badge>
                                    {session.workout_type?.toUpperCase()}
                                </Badge>
                                <Link
                                    to={`/workouts/${session.workout_id}`}
                                    className="text-2xl font-semibold w-full text-[var(--accent)] hover:underline"
                                >
                                    {session.workout_title}
                                </Link>


                                <div className="flex items-center gap-4 my-1">
                                    {/* Difficulty */}
                                    <div className="flex items-center gap-2 text-sm sm:text-xl">
                                        <span className="text-[var(--subhead-text)]">Difficulty:</span>
                                        <span className="flex items-center">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <svg
                                                    key={i}
                                                    className={`w-5 h-5 ${i < (session.difficulty ?? 0) ? "text-yellow-400" : "text-gray-300"}`}
                                                    fill={i < (session.difficulty ?? 0) ? "currentColor" : "none"}
                                                    stroke="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <polygon
                                                        points="10,1 12.59,7.36 19.51,7.36 13.96,11.64 16.55,18 10,13.72 3.45,18 6.04,11.64 0.49,7.36 7.41,7.36"
                                                        strokeLinejoin="round"
                                                        strokeWidth="1"
                                                    />
                                                </svg>
                                            ))}
                                        </span>
                                    </div>
                                    {/* Duration */}
                                    {session.duration_minutes && (
                                        <div className="flex items-center gap-2 text-sm sm:text-xl">
                                            <span className="text-[var(--subhead-text)]">Duration:</span>
                                            <span className="text-[var(--accent)] font-semibold">
                                                {session.duration_minutes} min
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {session.session_notes && (
                                <div>
                                    <p><span className="font-semibold text-[var(--accent)]">{session.username}</span>'s notes for this workout:</p>
                                    <p className="text-[var(--subhead-text)] italic">{session.session_notes}</p>
                                </div>
                            )}

                            <LikeCommentButtons
                                likeCount={likeCount}
                                commentCount={commentCount}
                                onLikeToggle={onLikeToggle}
                                onLikeClickMobile={() => setDrawerOpen(true)}
                                onCommentClick={() => {
                                    const commentSection = document.getElementById(`add-comment-form`);
                                    if (commentSection) {
                                        commentSection.scrollIntoView({ behavior: "smooth" });
                                    }
                                }}
                                liked={liked}
                                disabled={!authUser}
                            />
                        </div>


                        {/* exercises */}
                        {session.completed_exercises && (

                            <>
                                <p className='text-lg font-semibold text-[var(--accent)] bg-[var(--accent-hover)] px-6 py-2 -ml-6 -mr-6 my-6'>Exercises ({session.completed_exercises.length})</p>
                                <ul className="my-2 space-y-4">
                                    {session.completed_exercises.map((exercise, idx) => {
                                        const type = exercise.exercise_type?.toLowerCase();
                                        let value;
                                        let targetDisplay = "";

                                        // Target formatting
                                        if (exercise.exercise_target) {
                                            if ("sets" in exercise.exercise_target && "reps" in exercise.exercise_target) {
                                                targetDisplay = `${exercise.exercise_target.sets} x ${exercise.exercise_target.reps}`;
                                            } else if ("duration_seconds" in exercise.exercise_target) {
                                                const min = exercise.exercise_target.duration_seconds !== undefined
                                                    ? Math.round(exercise.exercise_target.duration_seconds / 60)
                                                    : 0;
                                                targetDisplay = `${min} min`;
                                            } else if ("distance_miles" in exercise.exercise_target) {
                                                targetDisplay = `${exercise.exercise_target.distance_miles} mi`;
                                            }
                                        }

                                        // Value formatting
                                        if (typeof type === "string" && ["strength", "plyometric", "other"].includes(type)) {
                                            value = `${exercise.sets_completed ?? "-"} x ${exercise.reps_completed ?? "-"}`;
                                            if (exercise.weight_used) value += ` @ ${exercise.weight_used} lbs`;
                                        } else if (typeof type === "string" && ["cardio", "flexibility", "stretch", "balance"].includes(type)) {
                                            const minutes = exercise.duration_seconds ? Math.round(exercise.duration_seconds / 60) : 0;
                                            value = `${minutes} min`;
                                            if (exercise.distance_miles) value += ` · ${exercise.distance_miles} mi`;
                                            if (exercise.pace_minutes_per_mile) value += ` · ${exercise.pace_minutes_per_mile} pace`;
                                        } else {
                                            value = `${exercise.distance_miles ?? "-"} mi`;
                                        }

                                        return (
                                            <li key={idx} className="">
                                                <p className="font-semibold text-[var(--accent)] text-base sm:text-lg">{exercise.title ?? "Exercise"}</p>
                                                <div className="flex justify-between items-center gap-2">
                                                    {targetDisplay && (
                                                        <p className="text-[var(--subhead-text)]">Target: <span className="font-semibold">{targetDisplay}</span></p>
                                                    )}
                                                    <p className="text-[var(--accent)] font-semibold">{value}</p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </>

                        )}


                        {/* Drawer for likes - only visible on mobile/tablet */}
                        <div className="md:hidden">
                            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                                <DrawerContent>
                                    <DrawerHeader>
                                        <DrawerTitle className="text-xl font-semibold">Likes</DrawerTitle>
                                        <DrawerClose />
                                    </DrawerHeader>
                                    <div className="px-4 pb-4" id="likes-section">
                                        {likes && likes.length > 0 ? (
                                            <ul>
                                                {likes.map((like: Like, idx: number) => (
                                                    <li
                                                        key={like.user_id}
                                                        className="p-4 bg-white shadow-sm rounded-md mb-2 flex items-center justify-between"
                                                    >
                                                        <Link
                                                            to={`/user/${like.username}`}
                                                            className="text-xl text-[var(--accent)] flex items-center gap-4 hover:underline"
                                                        >
                                                            <Avatar className="size-10 rounded-md">
                                                                {like.profile_pic ? (
                                                                    <AvatarImage src={like.profile_pic} alt={like.username} />
                                                                ) : (
                                                                    <AvatarFallback>
                                                                        {like.username}
                                                                    </AvatarFallback>
                                                                )}
                                                            </Avatar>
                                                            <p className="text-xl text-[var(--accent)]">{like.username}</p>
                                                        </Link>
                                                        <UserPlus size={20} className="ml-4 text-[var(--accent)]" />
                                                        {idx < (likes?.length ?? 0) - 1 && (
                                                            <div className="border-t border-[#f4f4f4] mx-2" />
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No likes yet.</p>
                                        )}
                                    </div>
                                </DrawerContent>
                            </Drawer>
                        </div>
                    </CardContent>
                    <CardFooter
                        id="add-comment-form"
                        className="flex flex-col gap-4 "
                    >
                        {/* comment form */}
                        {authUser ? (
                            <div className="w-full pb-4 border-b border-[#f4f4f4]">
                                <AddCommentForm
                                    session_id={session.session_id}
                                    onCommentAdded={onCommentAdded}
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--subhead-text)]">Log in to add a comment.</p>
                        )}
                        {/* comments list */}
                        <div className="flex flex-col gap-4 w-full">
                            {comments && comments.length > 0 ? (
                                comments.map((comment) => (
                                    <CommentItem key={comment.comment_id} comment={comment} />
                                ))
                            ) : (
                                <p className="text-sm text-[var(--subhead-text)]">No comments yet. Be the first to comment!</p>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            }
        </>
    )
}

export default ViewSessionItem;