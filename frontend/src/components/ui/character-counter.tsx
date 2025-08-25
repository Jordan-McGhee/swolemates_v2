import React from "react";

interface CharacterCounterProps {
    value: string;
    max: number;
    className?: string;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
    value,
    max,
    className = "",
}) => {
    const isOverLimit = value.length > max;
    return (
        <p
            className={`ml-auto mt-1.5 text-xs text-right ${
                isOverLimit ? "text-[var(--danger)]" : "text-[var(--subhead-text)]"
            } ${className}`}
        >
            {value.length}/{max} characters
        </p>
    );
};