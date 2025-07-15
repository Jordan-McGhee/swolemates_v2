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

const LoginForm = () => {
    const { logInWithEmail, logInWithGoogle, isAuthLoading, hasError, clearError } = useAuth();

    const [formData, setFormData] = useState({
        usernameOrEmail: "",
        password: ""
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/]).{8,}$/;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: "" }));
        if (hasError) clearError();
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.usernameOrEmail.trim()) newErrors.usernameOrEmail = "Username or Email is required.";
        if (!passwordRegex.test(formData.password)) newErrors.password = "Password must be 8+ characters with number and symbol.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await logInWithEmail(formData.usernameOrEmail, formData.password);
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
                        filter: "invert(29%) sepia(76%) saturate(1263%) hue-rotate(147deg) brightness(95%) contrast(101%)"
                    }}
                />
                <h2 className="text-2xl font-semibold text-accent">Welcome Back!</h2>
            </div>

            <AuthInput
                name="usernameOrEmail"
                label="Username or Email"
                value={formData.usernameOrEmail}
                onChange={handleChange}
                error={errors.usernameOrEmail}
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

            <Button variant={"outline"} disabled={isAuthLoading} className="w-full bg-accent text-white hover:bg-white hover:text-accent hover:cursor-pointer" type="submit">
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

export default LoginForm;
