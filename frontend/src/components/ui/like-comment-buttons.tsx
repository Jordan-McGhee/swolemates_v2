import React from "react";

// ui imports
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle } from "lucide-react";

// type imports
import { LikeCommentButtonsProps } from "@/types/props/props-types";

export const LikeCommentButtons: React.FC<LikeCommentButtonsProps> = ({
    liked,
    likesCount,
    commentsCount,
    onLikeToggle,
    onCommentClick,
    disabled = false,
}) => (
    <div className="flex items-center gap-4 mt-3">
        <Button
            variant="outline"
            className={`group flex items-center gap-2 px-3 py-1 border border-[var(--accent-hover)] text-sm hover:text-[var(--white)] hover:border-[var(--white)] ${liked
                    ? "bg-[var(--accent-hover)] text-[var(--accent)] border border-[var(--accent)] hover:text-[var(--white)] hover:border-[var(--white)]"
                    : ""
                }`}
            onClick={onLikeToggle}
            disabled={disabled}
            aria-pressed={liked}
            aria-label={liked ? "Unlike" : "Like"}
        >
            <ThumbsUp size={18} className="transition-colors" />
            {likesCount}
        </Button>
        <Button
            variant="outline"
            className="flex items-center gap-2 px-3 py-1 border border-[var(--accent-hover)] text-sm hover:text-[var(--white)] hover:border-[var(--white)]"
            onClick={onCommentClick}
            disabled={disabled}
            aria-label="Comment"
        >
            <MessageCircle size={18} />
            {commentsCount}
        </Button>
    </div>
);

export default LikeCommentButtons;