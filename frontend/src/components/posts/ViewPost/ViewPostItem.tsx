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

// component imports
import LikeCommentButtons from "@/components/ui/like-comment-buttons";
import AddCommentForm from "@/components/comments/AddCommentForm";
import CommentItem from "@/components/comments/CommentItem";

// type imports
import { Like, ViewPostItemProps } from "@/types/props/props-types";

// util imports
import { formatDate } from "@/util/general-util";

// hook import
import { useAuth } from "@/context/AuthProvider";

const ViewPostItem: React.FC<ViewPostItemProps> = ({
    post,
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
            {post && (

                <Card className={`bg-[var(--white)] shadow-lg text-left`}>
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
                            likeCount={likeCount}
                            commentCount={commentCount}
                            onLikeToggle={onLikeToggle}
                            onLikeClickMobile={() => { setDrawerOpen(true); }}
                            onCommentClick={() => {
                                const commentSection = document.getElementById(`add-comment-form`);
                                if (commentSection) {
                                    commentSection.scrollIntoView({ behavior: "smooth" });
                                }
                            }}
                            liked={liked}
                            disabled={!authUser}
                            hideComments={false}
                        />

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

                    {/* <div className="flex-1 border-t border-[#f4f4f4]" /> */}

                    <CardFooter
                        id="add-comment-form"
                        className="flex flex-col gap-4"
                    >
                        {/* comment form */}
                        {authUser ? (
                            <div className="w-full pb-4 border-b border-[#f4f4f4]">
                                <AddCommentForm
                                    post_id={post.post_id}
                                    onCommentAdded={onCommentAdded}
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--subhead-text)]">Log in to add a comment.</p>
                        )}

                        {comments.length > 0 ? (
                            <div className="w-full flex flex-col gap-0">
                                {comments.map((comment, idx) => (
                                    <React.Fragment key={comment.comment_id}>
                                        <CommentItem comment={comment} />
                                        {idx < comments.length - 1 && (
                                            <div className="border-t border-[#f4f4f4] mx-2 my-1" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--subhead-text)]">No comments yet.</p>
                        )}
                    </CardFooter>
                </Card>
            )}
        </>
    );
}

export default ViewPostItem;