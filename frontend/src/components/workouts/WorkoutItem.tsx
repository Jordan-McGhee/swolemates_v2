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
// import AddCommentForm from "@/components/comments/AddCommentForm";

// type imports
import { WorkoutItemProps, Like } from "@/types/props/props-types";

// util imports
import { formatDate } from "@/util/general-util";

// hook import
import { useAuth } from "@/context/AuthProvider";
import { workoutApi } from "@/api/workoutApi";

export const WorkoutItem: React.FC<WorkoutItemProps> = ({ user, workout }) => {

    // hook destructuring
    const { user: authUser, token } = useAuth();
    const { likeWorkout, unlikeWorkout } = workoutApi();
    const navigate = useNavigate();

    // Like functionality
    const [likeCount, setlikeCount] = useState<number>(workout.likes?.length ?? 0);
    const [liked, setLiked] = useState<boolean>(
        workout.likes?.some((like: Like) => like.user_id === authUser?.user_id) ?? false
    );

    // comment functionality
    const [commentCount, setcommentCount] = useState<number>(workout.comments?.length ?? 0);

    const handleLikeToggle = async () => {
        if (!authUser || !token) return;
        if (liked) {
            try {
                await unlikeWorkout(workout.workout_id);
                setlikeCount((count) => count - 1);
                setLiked(false);
                toast(
                    <>
                        You unliked that workout - nice!
                    </>
                );
            } catch (error) {
                console.error("Failed to unlike workout:", error);
            }
        } else {
            try {
                await likeWorkout(workout.workout_id);
                setlikeCount((count) => count + 1);
                setLiked(true);
                toast.success(
                    <>
                        You liked that workout - nice!
                    </>
                );
            } catch (error) {
                console.error("Failed to like workout:", error);
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
                        <p className="text-sm font-semibold text-[var(--accent)]">{user?.username} <span className="text-[var(--subhead-text)]">created a workout!</span></p>
                        <p className="text-xs text-[var(--subhead-text)]">
                            {formatDate(workout.created_at, "relative")}
                        </p>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <EllipsisVertical className="w-5 h-5 text-[var(--subhead-text)] hover:cursor-pointer hover:text-[var(--accent)] -mr-2" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel className="text-[var(--subhead-text)] text-xs font-bold">Workout Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link to={`/workouts/${workout.workout_id}`}>
                                View Workout
                            </Link>
                        </DropdownMenuItem>
                        {user?.user_id === workout.user_id && (
                            <>
                                <DropdownMenuItem asChild>
                                    <Link to={`/sessions/create?workout_id=${workout.workout_id}`}>
                                        Create Session
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to={`/workouts/${workout.workout_id}/edit`}>
                                        Edit Workout
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem variant="destructive">
                                    Delete Workout
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex flex-col justify-start">

                {/* workout info */}
                <div className="flex flex-col">
                    <Badge className="mb-2">
                        {workout.workout_type.toUpperCase()}
                    </Badge>

                    <Link
                        to={`/workouts/${workout.workout_id}`}
                        className="font-bold text-xl text-[var(--accent)] hover:underline hover:cursor-pointer"
                    >
                        {workout.workout_title}
                    </Link>
                    {workout.workout_description && (
                        <p className="text-[var(--subhead-text)] mt-1">{workout.workout_description}</p>
                    )}
                </div>

                {/* exercises */}
                {workout.exercises && (
                    <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-[var(--accent)]">
                            View Exercises ({workout.exercises.length})
                        </summary>
                        <ul className="mt-2 space-y-1">
                            {workout.exercises.map((exercise, idx) => {
                                const type = exercise.exercise_type?.toLowerCase();
                                let value;
                                if (["strength", "plyometric", "other"].includes(type)) {
                                    value = `${exercise.sets} x ${exercise.reps}`;
                                } else if (["cardio", "flexibility", "stretch", "balance"].includes(type)) {
                                    const minutes = exercise.duration_seconds ? Math.round(exercise.duration_seconds / 60) : 0;
                                    value = `${minutes} minutes`;
                                } else {
                                    value = `${exercise.distance_miles} miles`;
                                }
                                return (
                                    <li key={idx} className="grid grid-cols-[1fr_auto] items-center gap-2 py-1 text-[var(--subhead-text)] text-sm md:text-lg">
                                        <span className="font-semibold text-[var(--accent)]">· {exercise.title}</span>
                                        <span className="justify-self-end px-2 rounded">{value}</span>
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
                        navigate(`/workouts/${workout.workout_id}?show=likes`);
                    }}
                    onLikeClickDesktop={() => {
                        navigate(`/workouts/${workout.workout_id}`);
                    }}
                    onCommentClick={() => {
                        navigate(`/workouts/${workout.workout_id}`);
                    }}
                    disabled={!authUser}
                    hideComments={false}
                />
            </CardContent>
        </Card>
    )
}

export default WorkoutItem;