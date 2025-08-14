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
import ViewWorkoutExerciseItem from "@/components/workouts/ViewWorkout/ViewWorkoutExerciseItem";

// type imports
import { Like, ViewWorkoutItemProps } from "@/types/props/props-types";

// util imports
import { formatDate } from "@/util/general-util";

// hook import
import { useAuth } from "@/context/AuthProvider";

const ViewWorkoutItem: React.FC<ViewWorkoutItemProps> = ({
    workout,
    likes,
    likeCount,
    liked,
    comments,
    commentCount,
    onLikeToggle,
    onCommentAdded
}) => {

    // hook destructuring
    const { user: authUser } = useAuth();

    // mobile drawer state
    const searchParams = new URLSearchParams(window.location.search);
    const [drawerOpen, setDrawerOpen] = useState(searchParams.get("show") === "likes");

    return (
        <>

            {
                workout &&

                <Card className={`bg-[var(--white)] shadow-lg text-left text-[var(--subhead-text)]`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">

                        {/* workout info and user avatar */}
                        <div className="flex flex-col gap-2 w-full">

                            <Badge className="">
                                {workout.workout_type.toUpperCase()}
                            </Badge>
                            {/* title and description */}
                            <p className="text-2xl font-semibold w-full">{workout.workout_title}</p>

                        </div>

                        {/* workout options */}
                        {authUser && (
                            <DropdownMenu>
                                <DropdownMenuTrigger className="p-2 rounded-full hover:bg-[var(--off-bg)] transition">
                                    <EllipsisVertical size={20} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuLabel>Workout Options</DropdownMenuLabel>
                                    <DropdownMenuItem>
                                        <Link
                                            to={`/sessions/create?workout_id=${workout.workout_id}`}
                                            className="w-full h-full block"
                                        >
                                            Create Session
                                        </Link>
                                    </DropdownMenuItem>

                                    {/* edit/delete options */}
                                    {
                                        authUser.user_id === workout.user_id && (
                                            <>
                                                <DropdownMenuItem>
                                                    <Link to={`/workouts/${workout.workout_id}/edit`} className="w-full h-full block">
                                                        Edit Workout
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={() => {
                                                        toast.error("Delete workout functionality not implemented.");
                                                    }}
                                                >
                                                    Delete Workout
                                                </DropdownMenuItem>
                                            </>
                                        )
                                    }
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </CardHeader>

                    <CardContent className="">

                        <div className="flex flex-col gap-2 -mt-4 mb-4">
                            {
                                workout.workout_description &&
                                <p className="text-[var(--subhead-text)]">{workout.workout_description}</p>
                            }

                            {/* user avatar and name */}
                            <div className="flex flex-row items-center -mb-2">
                                <div className="flex items-center gap-3">
                                    <Avatar className="size-8 rounded-md">
                                        {workout.profile_pic ? (
                                            <AvatarImage src={workout.profile_pic} alt={workout.username} />
                                        ) : (
                                            <AvatarFallback>
                                                {workout.username}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="text-left">
                                        <Link to={`/user/${workout.username}`} className="font-medium text-[var(--accent)] hover:underline">
                                            {workout.username}
                                        </Link>
                                        <p className="text-sm text-[var(--subhead-text)]">
                                            {formatDate(workout.created_at, "relative")}
                                        </p>
                                    </div>
                                </div>
                            </div>

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

                        {/* exercise list */}
                        {workout.exercises.map((exercise, idx) => {
                            // Ensure the required properties are present
                            const workoutExercise = {
                                ...exercise,
                                workout_id: workout.workout_id,
                                exercise_id: exercise.exercise_id ?? idx
                            };
                            return (
                                <ViewWorkoutExerciseItem
                                    key={workoutExercise.exercise_id}
                                    exercise={workoutExercise}
                                    index={idx}
                                />
                            );
                        })}

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
                                                        {/* Standalone UserPlus icon */}
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
                                    workout_id={workout.workout_id}
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

export default ViewWorkoutItem;