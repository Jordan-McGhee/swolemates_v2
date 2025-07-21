import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/api/authApi";

// type imports
import { AuthContextValue, AuthProviderProps, PostgreSQLUser } from "@/types/props/props-types";

// Create AuthContext
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<PostgreSQLUser | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const justAuthenticatedRef = useRef(false);

    const navigate = useNavigate();

    const {
        checkUsernameAvailability,
        checkEmailAvailability,
        signUpWithEmail,
        logInWithEmail,
        logInWithGoogle,
        logOut,
        syncUserWithBackend,
        getPostgreSQLUser,
        onAuthChange,
        isLoadingAuth,
        hasError,
        clearError,
    } = authApi();

    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            setIsAuthLoading(true);
            try {
                if (firebaseUser) {
                    if (justAuthenticatedRef.current) {
                        justAuthenticatedRef.current = false;
                        return;
                    }

                    console.log("Fetching PostgreSQL user for:", firebaseUser.uid);
                    const pgUser = await getPostgreSQLUser(firebaseUser);
                    setUser(pgUser.user ?? pgUser);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Error fetching PostgreSQL user on auth change:", error);
                setUser(null);
            } finally {
                setIsAuthLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const handleSignUp = async (email: string, password: string, username: string) => {
        setIsAuthLoading(true);
        try {
            const credentials = await signUpWithEmail(email, password, username);
            const pgUser = await syncUserWithBackend(credentials.user);
            setUser(pgUser.user ?? pgUser);
            justAuthenticatedRef.current = true;
        } catch (error) {
            console.error("Sign up error:", error);
            throw error;
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleLoginEmail = async (email: string, password: string) => {
        setIsAuthLoading(true);
        try {
            const credentials = await logInWithEmail(email, password);
            const pgUser = await syncUserWithBackend(credentials.user);
            setUser(pgUser.user ?? pgUser);
            justAuthenticatedRef.current = true;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleLoginGoogle = async () => {
        setIsAuthLoading(true);
        try {
            const credentials = await logInWithGoogle();
            const pgUser = await syncUserWithBackend(credentials.user);
            setUser(pgUser.user ?? pgUser);
            justAuthenticatedRef.current = true;
        } catch (error) {
            console.error("Google login error:", error);
            throw error;
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleLogout = async () => {
        setIsAuthLoading(true);
        try {
            await logOut();
            setUser(null);
            navigate("/");
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        } finally {
            setIsAuthLoading(false);
        }
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
                syncUserWithBackend,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
