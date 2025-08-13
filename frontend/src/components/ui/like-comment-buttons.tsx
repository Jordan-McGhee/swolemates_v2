import React from "react";

// ui imports
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle } from "lucide-react";

// type imports
import { LikeCommentButtonsProps } from "@/types/props/props-types";

export const LikeCommentButtons: React.FC<LikeCommentButtonsProps> = ({
    liked,
    likeCount,
    commentCount,
    onLikeToggle,
    onLikeClickMobile,
    onLikeClickDesktop,
    onCommentClick,
    disabled = false,
    hideComments = false,
}) => {
    return (
        <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-x-4 md:gap-x-3">
                <Button
                    variant="outline"
                    className={`group flex items-center px-3 py-1 border border-[var(--accent-hover)] text-sm hover:text-[var(--accent-hover)] hover:border-[var(--white)] ${liked
                        ? "bg-[var(--accent-hover)] text-[var(--accent)] border border-[var(--accent)] hover:text-[var(--accent-hover)] hover:border-[var(--white)]"
                        : ""
                        }`}
                    onClick={onLikeToggle}
                    disabled={disabled}
                    aria-pressed={liked}
                    aria-label={liked ? "Unlike" : "Like"}
                >
                    <ThumbsUp size={18} className="transition-colors" />
                </Button>
                {/* Tablet and smaller: clickable likes count */}
                <p
                    className={`font-semibold hover:cursor-pointer hover:underline ${liked ? "text-[var(--accent)]" : ""} block lg:hidden`}
                    aria-label="View likes"
                    tabIndex={0}
                    onClick={onLikeClickMobile}
                    role="button"
                >
                    {likeCount}
                </p>
                {/* Desktop and larger: non-clickable likes count */}
                <p
                    className={`text-sm font-semibold ${liked ? "text-[var(--accent)]" : ""} hidden lg:block ${
                        onLikeClickDesktop
                            ? "hover:cursor-pointer hover:underline"
                            : ""
                    }`}
                    aria-label="Likes count"
                    onClick={onLikeClickDesktop ?? undefined}
                >
                    {likeCount}
                </p>
                {!hideComments && (
                    <>
                        <Button
                            variant="outline"
                            className="flex items-center px-3 py-1 border border-[var(--accent-hover)] text-sm hover:text-[var(--accent-hover)] hover:border-[var(--white)]"
                            onClick={onCommentClick}
                            disabled={disabled}
                            aria-label="Comment"
                        >
                            <MessageCircle size={18} />
                        </Button>
                        <p
                            className="text-base md:text-sm font-semibold hover:cursor-pointer hover:underline"
                            aria-label="View comments"
                            tabIndex={0}
                            onClick={onCommentClick}
                            role="button"
                        >
                            {commentCount}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default LikeCommentButtons;