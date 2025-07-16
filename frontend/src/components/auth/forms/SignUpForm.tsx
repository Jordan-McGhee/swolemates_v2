import React, { useState } from "react";

// icon/asset imports
import { Loader2 } from "lucide-react";
import google from "../../../assets/google.png";
import swolematesLogo from "../../../assets/swolemates.png";

// hooks
import { useAuth } from "@/context/AuthProvider";

// components
import { Button } from "@/components/ui/button";
import AuthInput from "../AuthInput";

// validation utils
import {
    validateUsername,
    validateEmail,
    validatePassword,
    validateConfirmPassword,
} from "@/util/input-validators";

const SignupForm = () => {
    const {
        checkUsernameAvailability,
        checkEmailAvailability,
        handleSignUp,
        handleLoginGoogle,
        isAuthLoading,
        hasError,
        clearError,
    } = useAuth();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    // states
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [usernameCheck, setUsernameCheck] = useState<{
        isLoading: boolean;
        isAvailable: boolean | null;
    }>({
        isLoading: false,
        isAvailable: null,
    });

    const [emailCheck, setEmailCheck] = useState<{
        isLoading: boolean;
        isAvailable: boolean | null;
    }>({
        isLoading: false,
        isAvailable: null,
    });

    // handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        if (hasError) clearError();
    };

    const handleUsernameBlur = async () => {
        const error = validateUsername(formData.username);
        if (error) {
            setErrors((prev) => ({ ...prev, username: error }));
            setUsernameCheck({ isLoading: false, isAvailable: null });
            return;
        }

        setUsernameCheck({ isLoading: true, isAvailable: null });
        const available = await checkUsernameAvailability(formData.username);
        setUsernameCheck({ isLoading: false, isAvailable: available });

        if (!available) {
            setErrors((prev) => ({
                ...prev,
                username: "Username is already taken.",
            }));
        }
    };

    const handleEmailBlur = async () => {
        const error = validateEmail(formData.email);
        if (error) {
            setErrors((prev) => ({ ...prev, email: error }));
            setEmailCheck({ isLoading: false, isAvailable: null });
            return;
        }

        setEmailCheck({ isLoading: true, isAvailable: null });
        const available = await checkEmailAvailability(formData.email);
        setEmailCheck({ isLoading: false, isAvailable: available });

        if (!available) {
            setErrors((prev) => ({
                ...prev,
                email: "Email is already in use.",
            }));
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        newErrors.username = validateUsername(formData.username) || "";
        newErrors.email = validateEmail(formData.email) || "";
        newErrors.password = validatePassword(formData.password) || "";
        newErrors.confirmPassword = validateConfirmPassword(formData.password, formData.confirmPassword) || "";

        setErrors(newErrors);
        const hasAnyError = Object.values(newErrors).some((e) => e);
        if (hasAnyError) return;

        try {

            // Log the form data for debugging
            console.log("Signing up with:", formData);

            await handleSignUp(
                formData.email,
                formData.password,
                formData.username
            );
        } catch (err) {
            // Handle error if needed
        }
    };

    const isFormValid =
        formData.username.trim() &&
        formData.email.trim() &&
        formData.password &&
        formData.confirmPassword &&
        !errors.username &&
        !errors.email &&
        !errors.password &&
        !errors.confirmPassword;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Logo & Welcome */}
            <div className="flex flex-col items-center mb-4">
                <img
                    src={swolematesLogo}
                    alt="Swolemates Logo"
                    className="size-20"
                    style={{
                        filter:
                            "invert(42%) sepia(84%) saturate(542%) hue-rotate(134deg) brightness(94%) contrast(94%)",
                    }}
                />
                <h2 className="text-2xl font-semibold text-[var(--accent)]">
                    Welcome to Swolemates!
                </h2>
            </div>

            <AuthInput
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleUsernameBlur}
                validate={(value) => {
                    const error = validateUsername(value);
                    setErrors((prev) => ({ ...prev, username: error || "" }));
                    // Reset check when typing
                    setUsernameCheck({ isLoading: false, isAvailable: null });
                    return error;
                }}
                error={errors.username}
                isLoading={usernameCheck.isLoading}
                isAvailable={usernameCheck.isAvailable}
            />

            <AuthInput
                name="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
                validate={(value) => {
                    const error = validateEmail(value);
                    setErrors((prev) => ({ ...prev, email: error || "" }));
                    setEmailCheck({ isLoading: false, isAvailable: null });
                    return error;
                }}
                error={errors.email}
                isLoading={emailCheck.isLoading}
                isAvailable={emailCheck.isAvailable}
            />

            <AuthInput
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                isPassword
                validate={(value) => {
                    const error = validatePassword(value);
                    setErrors((prev) => ({ ...prev, password: error || "" }));
                    return error;
                }}
                error={errors.password}
            />

            <AuthInput
                name="confirmPassword"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                isPassword
                validate={(value) => {
                    const error = validateConfirmPassword(
                        formData.password,
                        value
                    );
                    setErrors((prev) => ({ ...prev, confirmPassword: error || "" }));
                    return error;
                }}
                error={errors.confirmPassword}
            />

            {hasError && (
                <p className="text-sm text-[var(--danger)]">{hasError}</p>
            )}

            <Button
                variant="outline"
                disabled={isAuthLoading || !isFormValid}
                className="w-full bg-[var(--accent)] text-[var(--white)] hover:bg-[var(--white)] hover:text-[var(--accent)] hover:cursor-pointer"
                type="submit"
            >
                {isAuthLoading && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Sign Up
            </Button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex-1 border-t border-border" />
                <span className="shrink-0">Or continue with</span>
                <div className="flex-1 border-t border-border" />
            </div>

            <Button
                type="button"
                onClick={handleLoginGoogle}
                variant="outline"
                className="w-full flex gap-2 justify-center text-[var(--accent)] hover:text-[var(--white)] hover:cursor-pointer"
            >
                <img src={google} alt="Google Logo" className="w-4 h-4" />
                Continue with Google
            </Button>
        </form>
    );
};

export default SignupForm;
