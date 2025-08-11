import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

// ui imports
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import { toast } from "sonner";

// component imports
import LikeCommentButtons from "@/components/ui/like-comment-buttons";
import AddCommentForm from "@/components/comments/AddCommentForm";
import ErrorModal from "@/components/ErrorModal";

// type imports
import { Post, Comment, Like } from "@/types/props/props-types";

// util imports
import { formatDate } from "@/util/general-util";

// hook import
import { useAuth } from "@/context/AuthProvider";
import { postApi } from "@/api/postApi";

const ViewPostItem = () => {

    // hook destructuring
    const { user: authUser, token } = useAuth();
    const { getSinglePost, likePost, unlikePost, isLoadingPost, hasError, clearError } = postApi();

    // Get post_id from URL params
    const { post_id } = useParams<{ post_id: string }>();

    // fetch post data
    const [post, setPost] = useState<Post>({} as Post);

    // Like functionality
    const [likesCount, setLikesCount] = useState<number>(0);
    const [liked, setLiked] = useState<boolean>(false);

    // comment functionality
    const [commentsCount, setCommentsCount] = useState<number>(0);
    const [comments, setComments] = useState<Comment[]>([]);

    // Fetch post data and update states
    useEffect(() => {
        const fetchPost = async () => {
            if (!post_id) return;
            try {
                const fetchedPost = await getSinglePost(Number(post_id));
                console.log("Fetched post:", fetchedPost);
                setPost(fetchedPost.post);
                setLikesCount(fetchedPost.post.likes?.length ?? 0);
                setLiked(
                    fetchedPost.post.likes?.some(
                        (like: Like) => Number(like.user_id) === Number(authUser?.user_id)
                    ) ?? false
                );
                setCommentsCount(fetchedPost.post.comments?.length ?? 0);
                setComments(fetchedPost.post.comments || []);
            } catch (error) {
                console.error("Failed to fetch post:", error);
            }
        };
        fetchPost();

    }, [post_id]);

    const handleLikeToggle = async () => {
        if (!authUser || !token) return;
        if (liked) {
            try {
                await unlikePost(post.post_id);
                setLikesCount((count) => count - 1);
                setLiked(false);
                toast(
                    <>
                        You unliked that post - nice!
                    </>
                );
            } catch (error) {
                console.error("Failed to unlike post:", error);
            }
        } else {
            try {
                await likePost(post.post_id);
                setLikesCount((count) => count + 1);
                setLiked(true);
                toast.success(
                    <>
                        You liked that post - nice!
                    </>
                );
            } catch (error) {
                console.error("Failed to like post:", error);
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
        setCommentsCount((count) => count + 1);
        setComments((prevComments) => [
            ...prevComments,
            populatedComment
        ]);
    };

    return (

        <>
            {/* error state */}
            {hasError && <ErrorModal error={hasError} onClear={clearError} />}

            {/* loading state */}
            {isLoadingPost && <div className="flex items-center justify-center h-screen">Loading...</div>}

            {(!isLoadingPost && post && post.post_id) && (
                <Card className={`bg-[var(--white)] shadow-sm text-left`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="size-8 rounded-md">
                                {post.profile_pic ? (
                                    <AvatarImage src={post.profile_pic} alt={post.username} />
                                ) : (
                                    <AvatarFallback>
                                        {post.username}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div className="text-left">
                                <Link to={`/user/${post.username}`} className="font-medium text-[var(--accent)] hover:underline">
                                    {post.username}
                                </Link>
                                <p className="text-sm text-[var(--subhead-text)]">{formatDate(post.created_at, "relative")}</p>
                            </div>
                        </div>

                        {/* post options */}
                        {authUser && authUser.user_id === post.user_id && (
                            <DropdownMenu>
                                <DropdownMenuTrigger className="p-2 rounded-full hover:bg-[var(--off-bg)] transition">
                                    <EllipsisVertical size={20} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuLabel>Post Options</DropdownMenuLabel>
                                    <DropdownMenuItem>
                                        <Link to={`/posts/${post.post_id}/edit`} className="w-full h-full block">
                                            Edit Post
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => {
                                            // Implement delete functionality
                                            toast.error("Delete functionality not implemented.");
                                        }}
                                    >
                                        Delete Post
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </CardHeader>

                    <CardContent className="whitespace-pre-wrap break-words text-[var(--subhead-text)]">

                        {post.content}

                        {/* like/comment */}
                        <LikeCommentButtons
                            likesCount={likesCount}
                            commentsCount={commentsCount}
                            onLikeToggle={handleLikeToggle}
                            onCommentClick={() => {
                                const commentSection = document.getElementById(`add-comment-form`);
                                if (commentSection) {
                                    commentSection.scrollIntoView({ behavior: "smooth" });
                                }
                            }}
                            liked={liked}
                            disabled={!authUser}
                        />

                        {comments.length > 0 && (
                            <div className="mt-4">
                                <p className="font-semibold mb-2 text-[var(--accent)]">Comments ({commentsCount})</p>
                                <div className="flex flex-col gap-4">
                                    {comments.map((comment) => (
                                        <div key={comment.comment_id} className="flex items-start gap-3 bg-[#f4f4f4] rounded-md p-3">
                                            <Avatar className="size-7 rounded-md">
                                                {comment.profile_pic ? (
                                                    <AvatarImage src={comment.profile_pic} alt={comment.username} />
                                                ) : (
                                                    <AvatarFallback>
                                                        {comment.username}
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>
                                            <div className="text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Link to={`/user/${comment.username}`} className="font-medium text-[var(--accent)] hover:underline">
                                                        {comment.username}
                                                    </Link>
                                                    <span className="text-xs text-[var(--subhead-text)]">{formatDate(comment.created_at, "relative")}</span>
                                                </div>
                                                <p className="text-[var(--main-text)] whitespace-pre-wrap">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <div className="flex-1 border-t border-[#f4f4f4]" />

                    <CardFooter
                        id="add-comment-form"
                        className="flex flex-col gap-4"
                    >
                        <AddCommentForm
                            post_id={post.post_id}
                            onCommentAdded={handleCommentAdded}
                        />
                    </CardFooter>
                </Card>
            )}
        </>
    );
}

export default ViewPostItem;