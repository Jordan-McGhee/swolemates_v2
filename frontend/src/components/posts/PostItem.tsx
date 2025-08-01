import React from "react";

// ui imports
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ThumbsUp, MessageCircle, EllipsisVertical, Dumbbell } from "lucide-react";
import { toast } from "sonner";

// component imports
import AddCommentForm from "@/components/comments/AddCommentForm";

// type imports
import { Post, PostItemProps, Comment, Like } from "@/types/props/props-types";

// util imports
import { formatDate } from "@/util/general-util";

// hook import
import { useAuth } from "@/context/AuthProvider";
import { postApi } from "@/api/postApi";


export const PostItem: React.FC<PostItemProps> = ({ user, post }) => {
    
    // hook destructuring
    const { user: authUser, token } = useAuth();
    const { likePost, unlikePost } = postApi();
    
    // Like functionality
    const [likesCount, setLikesCount] = React.useState(post.likes_count ?? 0);
    const [liked, setLiked] = React.useState(
        post.likes?.some((like: Like) => like.user_id === authUser?.user_id) ?? false
    );

    const handleLikeToggle = async () => {
        if (!authUser || !token) return;
        if (liked) {
            try {
                await unlikePost(post.post_id, authUser.user_id);
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
                await likePost(post.post_id, authUser.user_id);
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
    // const hasImage = !!post.image_url;

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
                        <p className="font-semibold text-sm">{user?.username}</p>
                        <p className="text-xs text-[var(--subhead-text)]">
                            {formatDate(post.created_at, "relative")}
                        </p>
                    </div>
                </div>


                <div className="flex items-center gap-x-2">
                    <div className="flex items-center gap-2 bg-[var(--accent-hover)] p-2 rounded-md text-[var(--accent)] text-xs">
                        <Dumbbell className="size-4 text-[var(--accent)]" />
                        <p className="max-w-24 truncate">Workout Title</p>
                    </div>


                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <EllipsisVertical className="w-5 h-5 text-[var(--subhead-text)] hover:cursor-pointer hover:text-[var(--accent)] -mr-2" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel className="text-[var(--subhead-text)] text-xs font-bold">Post Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                                View Post
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

                <div className="flex items-center gap-4 mt-3">
                    <div
                        className={`flex items-center gap-2 pr-2 text-sm hover:text-[var(--accent)] hover:cursor-pointer`}
                        onClick={handleLikeToggle}
                    >
                        <ThumbsUp
                            size={18}
                            fill={liked ? "var(--accent)" : "none"}
                            color={liked ? "var(--accent)" : "currentColor"}
                        />
                        {likesCount}
                    </div>
                    <div className="flex items-center gap-2 pr-2 text-sm hover:text-[var(--accent)] hover:cursor-pointer">
                        <MessageCircle size={18} />
                        {post.comments_count ?? 0}
                    </div>
                </div>
            </CardContent>

            <div className="flex-1 border-t border-[#f4f4f4]" />

            <CardFooter className="">
                <AddCommentForm
                    postId={post.post_id}
                    onCommentAdded={(comment: Comment) => {
                        // Handle comment added logic here, e.g., update state or notify parent component
                        console.log("Comment added:", comment);
                    }
                    }
                />
            </CardFooter>
        </Card>
    );
};

export default PostItem;