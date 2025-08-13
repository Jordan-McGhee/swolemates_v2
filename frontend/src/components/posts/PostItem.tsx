import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ui imports
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { EllipsisVertical, Dumbbell } from "lucide-react";
import { toast } from "sonner";

// component imports
import AddCommentForm from "@/components/comments/AddCommentForm";

// type imports
import { PostItemProps, Like } from "@/types/props/props-types";

// util imports
import { formatDate } from "@/util/general-util";

// hook import
import { useAuth } from "@/context/AuthProvider";
import { postApi } from "@/api/postApi";
import LikeCommentButtons from "../ui/like-comment-buttons";
export const PostItem: React.FC<PostItemProps> = ({ user, post }) => {

    // hook destructuring
    const { user: authUser, token } = useAuth();
    const { likePost, unlikePost } = postApi();
    const navigate = useNavigate();

    // Like functionality
    const [likeCount, setLikeCount] = useState<number>(post.likes?.length ?? 0);
    const [liked, setLiked] = useState<boolean>(
        post.likes?.some((like: Like) => like.user_id === authUser?.user_id) ?? false
    );

    // comment functionality
    const [commentCount, setCommentCount] = useState<number>(post.comments?.length ?? 0);

    const handleLikeToggle = async () => {
        if (!authUser || !token) return;
        if (liked) {
            try {
                await unlikePost(post.post_id);
                setLikeCount((count) => count - 1);
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
                setLikeCount((count) => count + 1);
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
    const handleCommentAdded = () => {
        setCommentCount((count) => count + 1);
    };

    return (
        <Card className={`bg-[var(--white)] shadow-sm`}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Avatar className="size-7 rounded-md">
                        {user?.profile_pic ? (
                            <AvatarImage src={user?.profile_pic} alt={user?.username} />
                        ) : (
                            <AvatarFallback>
                                {user?.username}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="text-left">
                        <p className="font-semibold text-sm text-[var(--accent)]">{user?.username}</p>
                        <p className="text-xs text-[var(--subhead-text)]">
                            {formatDate(post.created_at, "relative")}
                        </p>
                    </div>
                </div>


                <div className="flex items-center gap-x-2">

                    {/* Workout Tag */}
                    <div className="flex items-center gap-2 bg-[var(--accent-hover)] p-2 rounded-md text-[var(--accent)] text-xs">
                        <Dumbbell className="size-4 text-[var(--accent)]" />
                        <p className="max-w-24 truncate">Workout Title</p>
                    </div>

                    {/* Post Options */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <EllipsisVertical className="w-5 h-5 text-[var(--subhead-text)] hover:cursor-pointer hover:text-[var(--accent)] -mr-2" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel className="text-[var(--subhead-text)] text-xs font-bold">Post Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                                <Link to={`/posts/${post.post_id}`} className="w-full h-full block">
                                    View Post
                                </Link>
                            </DropdownMenuItem>
                            {user?.user_id === post.user_id && (
                                <>
                                    <DropdownMenuItem>
                                        Edit Post
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive">
                                        Delete Post
                                    </DropdownMenuItem>
                                </>
                            )}

                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>

            </CardHeader>

            <CardContent className="flex flex-col justify-start" >
                <p className="text-left">{post.content}</p>

                <LikeCommentButtons
                    liked={liked}
                    likeCount={likeCount}
                    commentCount={commentCount}
                    onLikeToggle={handleLikeToggle}
                    onLikeClickMobile={() => {
                        navigate(`/posts/${post.post_id}?show=likes`);
                    }}
                    onLikeClickDesktop={() => {
                        navigate(`/posts/${post.post_id}`);
                    }}
                    onCommentClick={() => {
                        navigate(`/posts/${post.post_id}`);
                    }}
                    disabled={!authUser}
                />
            </CardContent>

            {/* <div className="flex-1 border-t border-[#f4f4f4]" /> */}

            {/* <CardFooter className="">
                {authUser ? (
                    <AddCommentForm
                        post_id={post.post_id}
                        onCommentAdded={handleCommentAdded}
                    />
                ) : (
                    <div className="italic text-sm text-[var(--subhead-text)]">
                        You must log in to comment.
                    </div>
                )}
            </CardFooter> */}
        </Card>
    );
};

export default PostItem;