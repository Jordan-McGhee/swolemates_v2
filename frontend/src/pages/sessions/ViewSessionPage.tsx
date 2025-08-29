import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// component imports
import ViewSessionItem from "@/components/sessions/ViewSession/ViewSessionItem";
import ViewPageLikes from "@/components/posts/ViewPost/ViewPageLikes";
import { ViewItemPageSkeleton, ViewItemPageSidebarSkeleton } from "@/components/skeletons/ViewItemPageSkeletons";

// ui imports
import { toast } from "sonner";

// type imports
import { Like, Comment, WorkoutSession } from "@/types/props/props-types";

// hook imports
import { useAuth } from "@/context/AuthProvider";
import { sessionApi } from "@/api/sessionApi";

const ViewSessionPage: React.FC = () => {

    // hook destructuring
    const { user: authUser, token } = useAuth();
    const { getSingleSession, likeSession, unlikeSession } = sessionApi();

    // session id from url params
    const { session_id } = useParams<{ session_id: string }>();

    // states
    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // like functionality
    const [likes, setLikes] = useState<Like[]>([]);
    const [liked, setLiked] = useState<boolean>(false);

    // comment functionality
    const [comments, setComments] = useState<Comment[]>([]);


    // Fetch session data and update states
    useEffect(() => {
        const fetchSession = async () => {
            if (!session_id) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const fetchedSession = await getSingleSession(Number(session_id));
                console.log("Fetched session:", fetchedSession);
                setSession(fetchedSession.session);
                setLiked(fetchedSession.likes?.some(
                    (like: Like) =>
                        Number(like.user_id) === Number(authUser?.user_id)
                ) ?? false);
                setLikes(fetchedSession.likes ?? []);
                setComments(fetchedSession.comments || []);
            } catch (error: any) {
                console.error("Failed to fetch session:", error);
                // toast.error(`Failed to fetch session: ${error?.message || error}`);
            } finally {
                setLoading(false);
            }
        };
        fetchSession();
    }, [session_id, authUser?.user_id]);

    // like handlers
    const handleLikesUpdate = (updatedLikes: Like[]) => {
        setLikes(updatedLikes);
        setLiked(updatedLikes.some(
            (like: Like) => Number(like.user_id) === Number(authUser?.user_id)
        ));

        setSession((prevSession) =>
            prevSession ? { ...prevSession, like_count: updatedLikes.length } : prevSession
        );
    };

    const handleLikeToggle = async () => {
        if (!authUser || !token || !session) return;

        if (liked) {
            try {
                const response = await unlikeSession(session.session_id);
                const updatedLikes = Array.isArray(response)
                    ? response
                    : response?.likes ?? [];
                handleLikesUpdate(updatedLikes);
                toast(
                    <>
                        You unliked this session - nice!
                    </>
                );
            } catch (error: any) {
                console.error("Failed to unlike session:", error);
                toast.error(`Failed to unlike session: ${error?.message || error}`);
            }
        } else {
            try {
                const response = await likeSession(session.session_id);
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
                        You liked this session - nice!
                    </>
                );
            } catch (error: any) {
                console.error("Failed to like session:", error);
                toast.error(`Failed to like session: ${error?.message || error}`);
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

        setSession((prevSession) =>
            prevSession
                ? {
                    ...prevSession,
                    comments: prevSession.comments
                        ? [...prevSession.comments, populatedComment]
                        : [populatedComment],
                }
                : prevSession
        );
    };

    // Show loading skeleton while fetching
    if (loading) {
        return (
            <div className="flex gap-4 w-full min-h-screen">
                {/* left side - skeleton */}
                <div className="w-full lg:w-[65%] flex flex-col gap-4 h-full">
                    <ViewItemPageSkeleton />
                </div>

                {/* right side - skeleton for likes section */}
                <div className="w-[35%] hidden sm:block h-screen">
                    <ViewItemPageSidebarSkeleton />
                </div>
            </div>
        );
    }

    // Show error state if session is not found after loading
    if (!loading && !session) {
        return (
            <div className="flex items-start justify-center sm:justify-start min-h-screen sm:min-h-0">
                <div className="text-center sm:text-left text-[var(--subhead-text)] mt-0">
                    <p className="text-xl font-semibold mb-2">Session not found</p>
                    <p>The session you're looking for doesn't exist or has been removed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-4 w-full min-h-screen">
            {/* left side */}
            <div className="w-full lg:w-[65%] flex flex-col gap-4 h-full">
                <ViewSessionItem
                    session={session!}
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
            <div className="w-[35%] hidden lg:block h-screen">
                <p className="text-xl font-semibold text-[var(--accent)] mb-2">Likes</p>
                <ViewPageLikes likes={likes} />

                {/* <ViewWorkoutFeaturedPosts /> */}
            </div>
        </div>
    )
}

export default ViewSessionPage;