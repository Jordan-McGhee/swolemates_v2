import { createContext, useContext, useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/api/authApi";

// type imports
import { AuthContextValue, AuthProviderProps, PostgreSQLUser } from "@/types/props/props-types";
import { User as FirebaseUser } from "firebase/auth";

// Create AuthContext
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<PostgreSQLUser | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const justAuthenticatedRef = useRef(false);

    const navigate = useNavigate();

    const {
        checkUsernameAvailability,
        checkEmailAvailability,
        updateUserProfile,
        signUpWithEmail,
        logInWithEmail,
        logInWithGoogle,
        logOut,
        deleteAccount,
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
            setFirebaseUser(firebaseUser ?? null);
            try {
                if (firebaseUser) {
                    // Get token string and set it in state
                    const idToken = await firebaseUser.getIdToken();
                    setToken(idToken);

                    if (justAuthenticatedRef.current) {
                        justAuthenticatedRef.current = false;
                        return;
                    }

                    console.log("Fetching PostgreSQL user for:", firebaseUser.uid);
                    const pgUser = await getPostgreSQLUser(firebaseUser);
                    setUser(pgUser.user ?? pgUser);
                } else {
                    setUser(null);
                    setToken(null);
                }
            } catch (error) {
                console.error("Error fetching PostgreSQL user on auth change:", error);
                setUser(null);
                setToken(null);
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
            setFirebaseUser(credentials.user);
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
            setFirebaseUser(credentials.user);
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
            setFirebaseUser(credentials.user);
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

    const handleUpdateUserProfile = async (profileUpdates: Partial<PostgreSQLUser>): Promise<PostgreSQLUser> => {
        setIsAuthLoading(true);
        try {
            if (!firebaseUser) throw new Error("No authenticated user");
            const updatedUser = await updateUserProfile(firebaseUser, profileUpdates);
            setUser(updatedUser ?? updatedUser);
            return updatedUser ?? updatedUser;
        } catch (error) {
            console.error("Update profile error:", error);
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
            setFirebaseUser(null);
            navigate("/");
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsAuthLoading(true);
        try {
            await deleteAccount();
            setUser(null);
            setFirebaseUser(null);

             // Navigate to home screen after successful delete
            navigate("/");
        } catch (error) {
            console.error("Delete account error:", error);
            throw error;
        } finally {
            setIsAuthLoading(false);
        }
    };

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        user,
        firebaseUser,
        token,
        isAuthLoading: isAuthLoading || isLoadingAuth,
        hasError,
        clearError,
        checkUsernameAvailability,
        checkEmailAvailability,
        handleSignUp,
        handleLoginEmail,
        handleLoginGoogle,
        handleUpdateUserProfile,
        handleLogout,
        handleDeleteAccount,
        syncUserWithBackend,
    }), [
        user,
        firebaseUser,
        token,
        isAuthLoading,
        isLoadingAuth,
        hasError,
        clearError,
        checkUsernameAvailability,
        checkEmailAvailability,
        handleSignUp,
        handleLoginEmail,
        handleLoginGoogle,
        handleUpdateUserProfile,
        handleLogout,
        handleDeleteAccount,
        syncUserWithBackend,
    ]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
