import React, { useState, useEffect } from "react";

// hook imports
import { useAuth } from "@/context/AuthProvider";
import { useFetch } from "@/hooks/useFetch";

// component imports
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

// type imports
import { AddCommentFormProps } from "@/types/props/props-types";

// util imports
import { validateCommentContent } from "@/util/input-validators";

const AddCommentForm: React.FC<AddCommentFormProps> = ({ postId, onCommentAdded }) => {
    const { user, token } = useAuth();
    const { sendRequest, isLoading, hasError, clearError } = useFetch();

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
        clearError(); // Clear any previous errors
        console.log("Submitting comment:", commentContent);
        // Prepare the comment data
        if (!user || !token) {
            console.error("You must be logged in to add a comment!");
            return;
        }

        try {
            const newComment = {
                post_id: postId,
                user_id: user?.user_id || 0,
                content: commentContent,
            };

            const response = await sendRequest({
                url: `/api/posts/${postId}/comments`,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newComment),
            });

            if (response) {
                // onCommentAdded(response);
                setCommentContent("");
            }
        } catch (error) {
            console.error("Failed to add comment:", error);
        }
    };

    const mobileCommentForm = (
        <></>
    )

    const desktopCommentForm = (
        <></>
    )

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-x-4 w-full">
            <Avatar className="size-8 rounded-md">
                {user?.profile_pic ? (
                    <AvatarImage src={user.profile_pic} alt={user.username} />
                ) : (
                    <AvatarFallback>{user?.username[0]}</AvatarFallback>
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