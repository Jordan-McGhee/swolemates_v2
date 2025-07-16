import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { authApi } from "@/api/authApi";

// type imports
import { AuthContextValue, AuthProviderProps } from "@/types/props/props-types";

// Create AuthContext
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {

    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    // use your authApi for helpers
    const {
        checkUsernameAvailability,
        checkEmailAvailability,
        signUpWithEmail,
        logInWithEmail,
        logInWithGoogle,
        logOut,
        syncUserWithBackend,
        onAuthChange,
        isLoadingAuth,
        hasError,
        clearError
    } = authApi();

    // Watch Firebase auth state
    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            setUser(firebaseUser ?? null);
            setIsAuthLoading(false);
        });
        return unsubscribe;
    }, [onAuthChange]);

    // wrap signUp so we also sync backend
    const handleSignUp = async (email: string, password: string, username: string) => {
        setIsAuthLoading(true);
        const credentials = await signUpWithEmail(email, password, username);
        await syncUserWithBackend(credentials.user);
        setUser(credentials.user);
        setIsAuthLoading(false);
    };

    // wrap login with email so we also sync backend
    const handleLoginEmail = async (email: string, password: string) => {
        setIsAuthLoading(true);
        const credentials = await logInWithEmail(email, password);
        await syncUserWithBackend(credentials.user);
        setUser(credentials.user);
        setIsAuthLoading(false);
    };

    // wrap google login so we also sync backend
    const handleLoginGoogle = async () => {
        setIsAuthLoading(true);
        const credentials = await logInWithGoogle();
        await syncUserWithBackend(credentials.user);
        setUser(credentials.user);
        setIsAuthLoading(false);
    };

    // wrap logout
    const handleLogout = async () => {
        setIsAuthLoading(true);
        await logOut();
        setUser(null);
        setIsAuthLoading(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthLoading: isAuthLoading || isLoadingAuth,
                hasError,
                clearError,
                checkUsernameAvailability,
                checkEmailAvailability,
                handleSignUp,
                handleLoginEmail,
                handleLoginGoogle,
                handleLogout,
                syncUserWithBackend
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Hook to use AuthContext
export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};