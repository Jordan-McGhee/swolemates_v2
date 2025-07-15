import React, { useState } from "react";

// icon/asset imports
import { Loader2 } from "lucide-react";
import google from "../../../assets/google.png";
import swolematesLogo from "../../../assets/swolemates.png";

// hook import
import { useAuth } from "@/context/AuthProvider";

// component import
import { Button } from "@/components/ui/button";
import AuthInput from "../AuthInput";

const SignupForm = () => {
    const { signUpWithEmail, logInWithGoogle, isAuthLoading, hasError, clearError } = useAuth();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        profilePic: null as File | null
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/]).{8,}$/;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, files } = e.target;
        if (files) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setErrors(prev => ({ ...prev, [name]: "" }));
        if (hasError) clearError();
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (formData.username.length < 6) newErrors.username = "Username must be at least 6 characters.";
        if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email address.";
        if (!passwordRegex.test(formData.password)) newErrors.password = "Password must be 8+ characters with number and symbol.";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords must match.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await signUpWithEmail(formData.email, formData.password, formData.username);
        } catch (err) { }
    };

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
                            "invert(42%) sepia(84%) saturate(542%) hue-rotate(134deg) brightness(94%) contrast(94%)"
                    }}
                />

                <h2 className="text-2xl font-semibold text-accent">Welcome to Swolemates!</h2>
            </div>

            <AuthInput
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                required
            />

            <AuthInput
                name="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
            />

            <AuthInput
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                isPassword
                error={errors.password}
                required
            />

            <AuthInput
                name="confirmPassword"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                isPassword
                error={errors.confirmPassword}
                required
            />

            {/* Optional profile picture */}
            <div className="flex flex-col gap-1">
                <label htmlFor="profilePic" className="text-sm font-medium">
                    Profile Picture (optional)
                </label>
                <input
                    type="file"
                    name="profilePic"
                    id="profilePic"
                    accept="image/*"
                    onChange={handleChange}
                    className="border rounded px-3 py-2"
                />
            </div>

            {hasError && <p className="text-sm text-destructive">{hasError}</p>}

            <Button variant={"outline"} disabled={isAuthLoading} className="w-full bg-accent text-white hover:bg-white hover:text-accent hover:cursor-pointer" type="submit">
                {isAuthLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Sign Up
            </Button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex-1 border-t border-border" />
                <span className="shrink-0">Or continue with</span>
                <div className="flex-1 border-t border-border" />
            </div>

            <Button
                type="button"
                onClick={logInWithGoogle}
                variant="outline"
                className="w-full flex gap-2 justify-center text-accent hover:text-white hover:cursor-pointer"
            >
                <img src={google} alt="Google Logo" className="w-4 h-4" />
                Continue with Google
            </Button>
        </form>
    );
};

export default SignupForm;
