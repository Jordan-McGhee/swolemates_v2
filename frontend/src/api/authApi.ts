// hook imports
import { useFetch } from "@/hooks/useFetch";

// firebase auth imports
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    updatePassword,
    deleteUser,
    User
} from "firebase/auth";

import { auth } from "@/firebaseConfig";

// auth api
export const authApi = () => {
    const { isLoading, hasError, sendRequest, clearError } = useFetch();

    // Use Vite env var
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // Check if username is available
    const checkUsernameAvailability = async (username: string): Promise<boolean> => {
        try {
            const data = await sendRequest({
                url: `${BACKEND_URL}/public/checkUsername?username=${encodeURIComponent(username)}`,
                method: "GET",
            });
            return (data as any).available;
        } catch (err) {
            console.error("Error checking username availability:", err);
            return false;
        }
    };

    // Check if email is available
    const checkEmailAvailability = async (email: string): Promise<boolean> => {
        try {
            const data = await sendRequest({
                url: `${BACKEND_URL}/public/checkEmail?email=${encodeURIComponent(email)}`,
                method: "GET",
            });
            return (data as any).available;
        } catch (err) {
            console.error("Error checking email availability:", err);
            return false;
        }
    };

    // Sync Firebase user to backend (for signup, login, password change)
    const syncUserWithBackend = async (user: User) => {
        console.log("Syncing user with backend:", user);

        const token = await user.getIdToken();
        console.log("Firebase token:", token);

        return await sendRequest({
            url: `${BACKEND_URL}/auth/sync`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                email: user.email,
                username: user.displayName || "",
                profile_pic: user.photoURL || null,
            }),
        });
    };

    // Sign up with email
    const signUpWithEmail = async (email: string, password: string, username: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update Firebase displayName with username
        await updateProfile(userCredential.user, {
            displayName: username,
        });

        return userCredential;
    };

    // Login with email
    const logInWithEmail = async (email: string, password: string) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
    };

    // Login with Google
    const googleProvider = new GoogleAuthProvider();
    const logInWithGoogle = async () => {
        const userCredential = await signInWithPopup(auth, googleProvider);
        return userCredential;
    };

    // Logout
    const logOut = () => {
        return signOut(auth);
    };

    // Change password and sync to backend
    const changePassword = async (newPassword: string) => {
        const user = auth.currentUser;
        if (!user) throw new Error("No user is currently signed in.");

        await updatePassword(user, newPassword);

        // Re-sync
        return await syncUserWithBackend(user);
    };

    // Delete user from backend
    const deleteUserFromBackend = async (firebase_uid: string) => {
        return await sendRequest({
            url: `${BACKEND_URL}/auth/${firebase_uid}`,
            method: "DELETE",
        });
    };

    // Delete account (Firebase + Postgres)
    const deleteAccount = async () => {
        const user = auth.currentUser;
        if (!user) throw new Error("No user is currently signed in.");

        const uid = user.uid;

        await deleteUser(user); // Firebase
        return await deleteUserFromBackend(uid); // PostgreSQL
    };

    // Auth state change for context
    const onAuthChange = (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, callback);
    };

    return {
        checkUsernameAvailability,
        checkEmailAvailability,
        signUpWithEmail,
        syncUserWithBackend,
        logInWithEmail,
        logInWithGoogle,
        logOut,
        changePassword,
        deleteAccount,
        onAuthChange,
        isLoadingAuth: isLoading,
        hasError,
        clearError,
    };
};
