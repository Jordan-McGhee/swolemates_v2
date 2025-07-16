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
import { validateEmail, validatePassword } from "@/util/input-validators";

const LoginForm = () => {
    const {
        handleLoginEmail,
        handleLoginGoogle,
        isAuthLoading,
        hasError,
        clearError
    } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: "" }));
        if (hasError) clearError();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        newErrors.email = validateEmail(formData.email) || "";
        newErrors.password = validatePassword(formData.password) || "";

        setErrors(newErrors);
        const hasAnyError = Object.values(newErrors).some(e => e);
        if (hasAnyError) return;

        try {
            await handleLoginEmail(formData.email, formData.password);
        } catch (err) {
            // Handle error if needed
        }
    };

    const isFormValid =
        formData.email.trim() &&
        formData.password &&
        !errors.email &&
        !errors.password;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">

            {/* Logo & Welcome */}
            <div className="flex flex-col items-center mb-4">
                <img
                    src={swolematesLogo}
                    alt="Swolemates Logo"
                    className="size-20"
                    style={{
                        filter: "invert(29%) sepia(76%) saturate(1263%) hue-rotate(147deg) brightness(95%) contrast(101%)"
                    }}
                />
                <h2 className="text-2xl font-semibold text-accent">Welcome Back!</h2>
            </div>

            <AuthInput
                name="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                validate={(value) => {
                    const error = validateEmail(value);
                    setErrors(prev => ({ ...prev, usernameOrEmail: error || "" }));
                    return error;
                }}
                error={errors.usernameOrEmail}
            />

            <AuthInput
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                isPassword
                validate={(value) => {
                    const error = validatePassword(value);
                    setErrors(prev => ({ ...prev, password: error || "" }));
                    return error;
                }}
                error={errors.password}
            />

            <Button
                variant="outline"
                disabled={isAuthLoading || !isFormValid}
                className="w-full bg-accent text-white hover:bg-white hover:text-accent hover:cursor-pointer"
                type="submit"
            >
                {isAuthLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Log In
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
                className="w-full flex gap-2 justify-center text-accent hover:text-white hover:cursor-pointer"
            >
                <img src={google} alt="Google Logo" className="w-4 h-4" />
                Continue with Google
            </Button>
        </form>
    );
};

export default LoginForm;
