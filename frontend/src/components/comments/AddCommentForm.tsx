import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// hook imports
import { useAuth } from "@/context/AuthProvider";
import { useFetch } from "@/hooks/useFetch";
import { postApi } from "@/api/postApi";
import { workoutApi } from "@/api/workoutApi";
import { sessionApi } from "@/api/sessionApi";

// ui imports
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// type imports
import { AddCommentFormProps } from "@/types/props/props-types";

// util imports
import { validateCommentContent } from "@/util/input-validators";

const AddCommentForm: React.FC<AddCommentFormProps> = ({ post_id, workout_id, session_id, onCommentAdded }) => {

    // hook destructuring
    const { user, token } = useAuth();
    const { isLoading, hasError, clearError } = useFetch();
    const { commentOnPost } = postApi();
    const { commentOnWorkout } = workoutApi();
    const { commentOnSession } = sessionApi();

    const [commentContent, setCommentContent] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCommentContent(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentContent.trim()) return;

        validateCommentContent(commentContent);
        if (hasError) {
            console.error("Invalid comment content:", hasError);
            return;
        }
        clearError();

        if (!user || !token) {
            console.error("You must be logged in to add a comment!");
            return;
        }

        try {
            let response;
            if (post_id) {
                response = await commentOnPost(post_id, commentContent);
            } else if (workout_id) {
                response = await commentOnWorkout(workout_id, commentContent);
            } else if (session_id) {
                response = await commentOnSession(session_id, commentContent);
            } else {
                toast.error("No valid target for comment.");
                return;
            }

            if (response) {
                onCommentAdded?.(response.comment);
                setCommentContent("");
                toast.success(
                    <>
                        Your comment was posted!
                        {/* <Link
                            to={
                                post_id
                                    ? `/posts/${post_id}`
                                    : workout_id
                                    ? `/workouts/${workout_id}`
                                    : session_id
                                    ? `/sessions/${session_id}`
                                    : "/"
                            }
                            className="text-[var(--accent)] hover:underline ml-2"
                        >
                            {post_id
                                ? "View post."
                                : workout_id
                                ? "View workout."
                                : session_id
                                ? "View session."
                                : "View comments."}
                        </Link> */}
                    </>
                );
            }
        } catch (error) {
            console.error("Failed to add comment:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-x-4 w-full">
            <Avatar className="size-7 rounded-md">
                {user?.profile_pic ? (
                    <AvatarImage src={user.profile_pic} alt={user.username} />
                ) : (
                    <AvatarFallback>{user?.username?.[0]}</AvatarFallback>
                )}
            </Avatar>
            <div className="relative flex-1">
                <Input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentContent}
                    onChange={handleChange}
                    className="h-8 border-none bg-[#f4f4f4] focus:ring-none shadow-sm text-xs placeholder:text-xs"
                />
            </div>
            <Button
                type="submit"
                disabled={isLoading || !commentContent.trim()}
                className=""
            >
                {isLoading ? "Posting..." : "Post"}
            </Button>
        </form>
    );
};
export default AddCommentForm;