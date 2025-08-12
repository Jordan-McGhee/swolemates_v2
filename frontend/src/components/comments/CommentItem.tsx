import React, { useState } from "react";
import { Link } from "react-router-dom";

// ui imports
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import LikeCommentButtons from "@/components/ui/like-comment-buttons";
import { formatDate } from "@/util/general-util";
import { toast } from "sonner";

// type imports
import { Comment, CommentItemProps, Like } from "@/types/props/props-types";

// hook imports
import { useAuth } from "@/context/AuthProvider";
import { commentApi } from "@/api/commentApi";

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {

    // hook destructuring
    const { user: authUser } = useAuth();
    const { likeComment, unlikeComment } = commentApi();


    const [likes, setLikes] = useState<Like[]>(comment.likes ?? []);
    const [liked, setLiked] = useState<boolean>(
        authUser ? likes.some((like) => like.user_id === authUser.user_id) : false
    );

    // like handlers 
    const handleLikeToggle = async () => {
        if (!authUser) return;
        if (liked) {
            try {
                await unlikeComment(comment.comment_id);
                setLikes((prev) => prev.filter((like) => like.user_id !== authUser.user_id));
                setLiked(false);
                toast(
                    <>
                        You unliked that comment - nice!
                    </>
                );
            } catch (error) {
                console.error("Failed to unlike comment:", error);
                toast.error(
                    <>
                        Failed to unlike comment. Please try again.
                    </>
                );
            }
        } else {
            try {
                await likeComment(comment.comment_id);
                setLikes((prev) => [...prev, { user_id: authUser.user_id } as Like]);
                setLiked(true);
                toast.success(
                    <>
                        You liked that comment - nice!
                    </>
                );
            } catch (error) {
                console.error("Failed to like comment:", error);
                toast.error(
                    <>
                        Failed to like comment. Please try again.
                    </>
                );
            }
        }
    };

    return (
        <div className="relative flex flex-col gap-2 py-3 bg-[var(--white)] rounded-md">
            <div className="flex items-center gap-3">
                <Avatar className="size-7 rounded-md">
                    {comment.profile_pic ? (
                        <AvatarImage src={comment.profile_pic} alt={comment.username} />
                    ) : (
                        <AvatarFallback>{comment.username}</AvatarFallback>
                    )}
                </Avatar>
                <div className="flex items-center gap-2">
                    <Link
                        to={`/user/${comment.username}`}
                        className="font-medium text-[var(--accent)] hover:underline"
                    >
                        {comment.username}
                    </Link>
                    <span className="text-sm text-[var(--subhead-text)]">
                        {formatDate(comment.created_at, "relative")}
                    </span>
                </div>
            </div>

            <p className="mt-1 mb-6 whitespace-pre-wrap break-words text-[var(--subhead-text)]">
                {comment.content}
            </p>

            <div className="absolute bottom-2 right-2">
                <LikeCommentButtons
                    likesCount={likes.length}
                    commentsCount={0}
                    onLikeToggle={handleLikeToggle}
                    onCommentClick={() => { }}
                    liked={liked}
                    hideComments={true}
                />
            </div>
        </div>
    );
};

export default CommentItem;