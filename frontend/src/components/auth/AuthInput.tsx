import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

// type import
import { AuthInputProps } from "@/types/props/props-types";

const AuthInput: React.FC<AuthInputProps> = ({
    name,
    label,
    placeholder,
    value,
    onChange,
    isPassword = false,
    error,
    required = false,
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType = isPassword ? (showPassword ? "text" : "password") : "text";

    return (
        <div className="w-full max-w-md space-y-1">
            {/* Static Label */}
            {label && (
                <label
                    htmlFor={name}
                    className="block text-sm font-medium text-muted-foreground"
                >
                    {label}
                </label>
            )}

            <div className="relative">
                <Input
                    id={name}
                    name={name}
                    type={inputType}
                    value={value}
                    placeholder={placeholder}
                    onChange={onChange}
                    required={required}
                    className={`pr-10 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? (
                            <EyeOff className="w-5 h-5 hover:cursor-pointer" />
                        ) : (
                            <Eye className="w-5 h-5 hover:cursor-pointer" />
                        )}
                    </button>
                )}
            </div>

            {error && (
                <p className="text-red text-xs mt-0.5">{error}</p>
            )}

        </div>
    );
};

export default AuthInput;
