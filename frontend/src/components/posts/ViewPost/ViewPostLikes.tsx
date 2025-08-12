import React from "react";
import { Link } from "react-router-dom";

// ui imports
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus } from "lucide-react";

// type imports
import { ViewPostLikesProps } from "@/types/props/props-types";

const ViewPostLikes: React.FC<ViewPostLikesProps> = ({ likes }) => {
    return (
        <Card className="w-full shadow-md bg-[var(--white)]">
            <CardHeader>
                <p className="text-lg font-semibold text-[var(--accent)]">Likes</p>
            </CardHeader>
            <CardContent>
                {likes && likes.length > 0 ? (
                    <ul>
                        {likes.map((like, idx) => (
                            <li
                                key={like.user_id}
                                className="p-4 shadow-sm rounded-md mb-2 flex items-center justify-between"
                            >
                                <Link
                                    to={`/user/${like.username}`}
                                    className="font-semibold text-[var(--accent)] flex items-center gap-4"
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
                                <UserPlus size={20} className="ml-4 text-[var(--accent)]" />
                                {idx < likes.length - 1 && (
                                    <div className="border-t border-[#f4f4f4] mx-2" />
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="-mt-2">No likes yet.</p>
                )}
            </CardContent>
        </Card>
    );
};

export default ViewPostLikes;