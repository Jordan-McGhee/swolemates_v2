import { useState } from "react";
import LoginForm from "./forms/LoginForm";
import SignupForm from "./forms/SignUpForm";

const AuthForm = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            {isLogin ? <LoginForm /> : <SignupForm />}

            <div className="text-sm text-center">
                {isLogin ? (
                    <>
                        Don’t have an account?{" "}
                        <button
                            type="button"
                            onClick={() => setIsLogin(false)}
                            className="italic hover:underline hover:cursor-pointer"
                        >
                            Sign Up
                        </button>
                    </>
                ) : (
                    <>
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => setIsLogin(true)}
                            className="italic hover:underline hover:cursor-pointer"
                        >
                            Log In
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthForm;
