import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// component imports
import ViewWorkoutItem from "@/components/workouts/ViewWorkout/ViewWorkoutItem";
import ViewPageLikes from "@/components/posts/ViewPost/ViewPageLikes";

// ui imports
import { toast } from "sonner";

// type imports
import { Like, Comment, Workout, Exercise, WorkoutExercise } from "@/types/props/props-types";

// hook imports
import { useAuth } from "@/context/AuthProvider";
import { workoutApi } from "@/api/workoutApi";

const ViewWorkoutPage: React.FC = () => {

    // hook destructuring
    const { user: authUser, token } = useAuth();
    const { getSingleWorkout, likeWorkout, unlikeWorkout } = workoutApi();

    // workout id from url params
    const { workout_id } = useParams<{ workout_id: string }>();

    // states
    const [workout, setWorkout] = useState<Workout | null>(null);

    // like functionality
    const [likes, setLikes] = useState<Like[]>([]);
    const [liked, setLiked] = useState<boolean>(false);

    // comment functionality
    const [comments, setComments] = useState<Comment[]>([]);

    // Fetch workout data and update states
    useEffect(() => {
        const fetchWorkout = async () => {
            if (!workout_id) return;
            try {
                const fetchedWorkout = await getSingleWorkout(Number(workout_id));
                // console.log("Fetched workout:", fetchedWorkout);
                setWorkout(fetchedWorkout.workout);
                setLiked(fetchedWorkout.likes?.some(
                    (like: Like) =>
                        Number(like.user_id) === Number(authUser?.user_id)
                ) ?? false);
                setLikes(fetchedWorkout.likes ?? []);
                setComments(fetchedWorkout.comments || []);
            } catch (error: any) {
                console.error("Failed to fetch workout:", error);
                // toast.error(`Failed to fetch workout: ${error?.message || error}`);
            }
        };
        fetchWorkout();
    }, [workout_id, authUser?.user_id]);

    // like handlers
    const handleLikesUpdate = (updatedLikes: Like[]) => {
        setLikes(updatedLikes);
        setLiked(
            updatedLikes.some(
                (like: Like) => Number(like.user_id) === Number(authUser?.user_id)
            )
        );
        setWorkout((prevWorkout) =>
            prevWorkout ? { ...prevWorkout, likes: updatedLikes } : prevWorkout
        );
    };

    const handleLikeToggle = async () => {
        if (!authUser || !token || !workout) return;

        if (liked) {
            try {
                const response = await unlikeWorkout(workout.workout_id);
                const updatedLikes = Array.isArray(response)
                    ? response
                    : response?.likes ?? [];
                handleLikesUpdate(updatedLikes);
                toast(
                    <>
                        You unliked that workout - nice!
                    </>
                );
            } catch (error: any) {
                console.error("Failed to unlike workout:", error);
                toast.error(`Failed to unlike workout: ${error?.message || error}`);
            }
        } else {
            try {
                const response = await likeWorkout(workout.workout_id);
                let updatedLikes = Array.isArray(response)
                    ? response
                    : response?.likes ?? [];

                // Ensure the current user's like info is present
                if (
                    !updatedLikes.some(
                        (like: Like) => String(like.user_id) === String(authUser?.user_id)
                    )
                ) {
                    updatedLikes = [
                        ...updatedLikes,
                        {
                            user_id: authUser?.user_id,
                            username: authUser?.username,
                            profile_pic: authUser?.profile_pic,
                        } as Like,
                    ];
                }
                handleLikesUpdate(updatedLikes);
                toast.success(
                    <>
                        You liked that workout - nice!
                    </>
                );
            } catch (error: any) {
                console.error("Failed to like workout:", error);
                toast.error(`Failed to like workout: ${error?.message || error}`);
            }
        }
    };

    // comment handlers
    const handleCommentAdded = (newComment: Comment) => {
        // Populate authUser info if available
        const populatedComment = {
            ...newComment,
            username: authUser?.username ?? newComment.username,
            profile_pic: authUser?.profile_pic ?? newComment.profile_pic,
        };
        setComments((prevComments) => [
            ...prevComments,
            populatedComment
        ]);

        setWorkout((prevWorkout) =>
            prevWorkout
                ? {
                    ...prevWorkout,
                    comments: prevWorkout.comments
                        ? [...prevWorkout.comments, populatedComment]
                        : [populatedComment],
                }
                : prevWorkout
        );
    };

    return (
        <div className="flex gap-4 w-full min-h-screen">
            {/* left side */}
            <div className="w-full lg:w-[65%] flex flex-col gap-4 overflow-y-auto h-full">
                <ViewWorkoutItem
                    workout={workout!}
                    liked={liked}
                    likes={likes}
                    likeCount={likes.length}
                    comments={comments}
                    commentCount={comments.length}
                    onLikeToggle={handleLikeToggle}
                    // onLikesUpdate={handleLikesUpdate}
                    onCommentAdded={handleCommentAdded}
                />
            </div>

            {/* right side */}
            <div className="w-[35%] hidden lg:block overflow-y-auto h-screen">
                <p className="text-xl font-semibold text-[var(--accent)] mb-2">Likes</p>
                <ViewPageLikes likes={likes} />

                {/* <ViewWorkoutFeaturedPosts /> */}
            </div>
        </div>
    )
}

export default ViewWorkoutPage;