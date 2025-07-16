import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

// type import
import { AuthInputProps } from "@/types/props/props-types";

const AuthInput: React.FC<AuthInputProps> = ({
    name,
    label,
    placeholder,
    value,
    onChange,
    validate,
    type,
    error,
    isPassword = false,
    onBlur,
    isLoading,
    isAvailable,
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleBlur = () => {
        if (validate) {
            validate(value);
        }
        if (onBlur) {
            onBlur();
        }
    };

    return (
        <div className="w-full max-w-md space-y-1">
            {label && (
                <label
                    htmlFor={name}
                    className={`block text-sm font-medium ${error ? "text-[var(--danger)]" : "text-[var(--subhead-text)]"
                        }`}
                >
                    {label}
                </label>
            )}

            <div className="relative">
                <Input
                    id={name}
                    name={name}
                    type={isPassword ? (showPassword ? "text" : "password") : type}
                    value={value}
                    placeholder={placeholder}
                    onChange={onChange}
                    onBlur={handleBlur}
                    className={`
                        pr-10
                        selection:bg-[var(--accent-hover)] selection:text-[var(--accent)]
                        ${error
                            ? "border-[var(--danger)] focus-visible:ring-[var(--danger)]"
                            : "focus:border-[var(--accent)] focus-visible:ring-[var(--accent)]"
                        }
                    `}
                />

                {/* Password toggle */}
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-[var(--subhead-text)] hover:text-[var(--accent)]"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? (
                            <EyeOff className="w-5 h-5 hover:cursor-pointer" />
                        ) : (
                            <Eye className="w-5 h-5 hover:cursor-pointer" />
                        )}
                    </button>
                )}

                {/* Availability Check Indicators (only show if not a password field) */}
                {!isPassword && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                        {isLoading && (
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-hover)]" />
                        )}
                        {!isLoading && isAvailable === true && (
                            <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                        )}
                        {!isLoading && isAvailable === false && (
                            <XCircle className="w-4 h-4 text-[var(--danger)]" />
                        )}
                    </div>
                )}
            </div>

            {error && <p className="text-[var(--danger)] text-xs mt-0.5">{error}</p>}
        </div>
    );
};

export default AuthInput;
