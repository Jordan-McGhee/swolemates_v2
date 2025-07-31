import React from "react";

// component imports
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// type imports
import { Post, PostItemProps, Comment, Like } from "@/types/props/props-types";

// util imports
import { formatDate } from "@/util/general-util";


export const PostItem: React.FC<PostItemProps> = ({ user, post }) => {
    const hasImage = !!post.image_url;

    return (
        <Card className={`mb-6 ${hasImage ? "p-0" : "p-4"}`}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Avatar>
                        {user?.profile_pic ? (
                            <AvatarImage src={user?.profile_pic} alt={user?.username} />
                        ) : (
                            <AvatarFallback>
                                {user?.username}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div>
                        <div className="font-semibold">{user?.username}</div>
                        <div className="text-xs text-muted-foreground">
                            {formatDate(post.created_at)}
                        </div>
                    </div>
                </div>
                {post.workout_id && post.workout_title ? (
                    <div className="text-right">
                        <div className="text-sm font-medium text-primary">
                            {post.workout_title}
                        </div>
                        {/* Optionally, add more workout info here */}
                    </div>
                ) : (
                    <div />
                )}
            </CardHeader>
            {hasImage && (
                <div className="w-full">
                    <img
                        src={post.image_url}
                        alt="Post"
                        className="w-full max-h-80 object-cover rounded-t-none rounded-b-md"
                    />
                </div>
            )}
            <CardContent className={hasImage ? "pt-4" : ""}>
                <p className="text-base">{post.content}</p>
            </CardContent>
            <CardFooter className="flex items-center gap-4">
                <Button variant="ghost" size="sm">
                    👍 {post.likes_count ?? 0}
                </Button>
                <Button variant="ghost" size="sm">
                    💬 {post.comments_count ?? 0}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default PostItem;