import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ui imports
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// component imports
import LikeCommentButtons from "../ui/like-comment-buttons";

// type imports
import { SessionItemProps, Like } from "@/types/props/props-types";

// util imports
import { formatDate } from "@/util/general-util";

// hook import
import { useAuth } from "@/context/AuthProvider";
import { sessionApi } from "@/api/sessionApi";

export const SessionItem: React.FC<SessionItemProps> = ({ user, session }) => {

    // hook destructuring
    const { user: authUser, token } = useAuth();
    const navigate = useNavigate();
    const { likeSession, unlikeSession } = sessionApi();

    // Like functionality
    const [likeCount, setlikeCount] = useState<number>(session.likes?.length ?? 0);
    const [liked, setLiked] = useState<boolean>(
        session.likes?.some((like: Like) => like.user_id === authUser?.user_id) ?? false
    );

    // comment functionality
    const [commentCount, setcommentCount] = useState<number>(session.comments?.length ?? 0);

    const handleLikeToggle = async () => {
        if (!authUser || !token) return;
        if (liked) {
            try {
                await unlikeSession(session.session_id);
                setlikeCount((count) => count - 1);
                setLiked(false);
                toast(
                    <>
                        You unliked that session - nice!
                    </>
                );
            } catch (error) {
                console.error("Failed to unlike session:", error);
            }
        } else {
            try {
                await likeSession(session.session_id);
                setlikeCount((count) => count + 1);
                setLiked(true);
                toast.success(
                    <>
                        You liked that session - nice!
                    </>
                );
            } catch (error) {
                console.error("Failed to like session:", error);
            }
        }
    };

    return (
        <Card className="bg-[var(--white)] shadow-sm text-left">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Avatar className="size-7 rounded-md">
                        {user?.profile_pic ? (
                            <AvatarImage src={user.profile_pic} alt={user.username} />
                        ) : (
                            <AvatarFallback>
                                {user?.username}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-[var(--accent)]">{user?.username}</p>
                        <p className="text-xs text-[var(--subhead-text)]">
                            {formatDate(session.created_at, "relative")}
                            {session.updated_at !== session.created_at && (
                                <span className="italic"> (Edited)</span>
                            )}
                        </p>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <EllipsisVertical className="w-5 h-5 text-[var(--subhead-text)] hover:cursor-pointer hover:text-[var(--accent)] -mr-2" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel className="text-[var(--subhead-text)] text-xs font-bold">Session Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link to={`/workouts/${session.workout_id}`}>
                                View Workout
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link to={`/sessions/${session.session_id}`}>
                                View Session
                            </Link>
                        </DropdownMenuItem>
                        {user?.user_id === session.user_id && (
                            <>
                                <DropdownMenuItem asChild>
                                    <Link to={`/sessions/${session.session_id}/edit`}>
                                        Edit Session
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive">
                                    Delete Session
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex flex-col justify-start">

                {/* session info */}
                <div className="flex flex-col">
                    <Link to={`/sessions/${session.session_id}`}>
                        <Badge className="mb-2 cursor-pointer hover:underline underline-offset-2">SESSION COMPLETED</Badge>
                    </Link>
                    {session.workout_title && (
                        <Link
                            to={`/workouts/${session.workout_id}`}
                            className="font-bold text-lg text-[var(--accent)] mb-1 hover:underline underline-offset-2"
                        >
                            {session.workout_title}
                        </Link>
                    )}
                    <div className="flex items-center gap-4 my-1">
                        {/* Difficulty */}
                        <div className="flex items-center gap-2 text-sm sm:text-base">
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
                            <div className="flex items-center gap-2 text-sm sm:text-base">
                                <span className="text-[var(--subhead-text)]">Duration:</span>
                                <span className="text-[var(--accent)] font-semibold">
                                    {session.duration_minutes} min
                                </span>
                            </div>
                        )}
                    </div>
                    {session.session_notes && (
                        <p className="text-[var(--subhead-text)] mt-1">{session.session_notes}</p>
                    )}
                </div>

                {/* exercises */}
                {session.completed_exercises && (
                    <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-[var(--accent)]">
                            View Exercises ({session.completed_exercises.length})
                        </summary>
                        <ul className="mt-2 space-y-2">
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
                    </details>
                )}
                <LikeCommentButtons
                    liked={liked}
                    likeCount={likeCount}
                    commentCount={commentCount}
                    onLikeToggle={handleLikeToggle}
                    onLikeClickMobile={() => {
                        navigate(`/sessions/${session.session_id}?show=likes`);
                    }}
                    onLikeClickDesktop={() => {
                        navigate(`/sessions/${session.session_id}`);
                    }}
                    onCommentClick={() => {
                        navigate(`/sessions/${session.session_id}`);
                    }}
                    disabled={!authUser}
                    hideComments={false}
                />
            </CardContent>
        </Card>
    )
}

export default SessionItem;