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

    // sign up with email
    const signUpWithEmail = async (email: string, password: string, username: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update Firebase displayName with username
        await updateProfile(userCredential.user, {
            displayName: username,
        });

        return userCredential;
    };

    // sync Firebase user to backend (for signup, login, password change)
    const syncUserWithBackend = async (user: User) => {
        const token = await user.getIdToken();

        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/auth/sync`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` // optional if backend checks
            },
            body: JSON.stringify({
                firebase_uid: user.uid,
                email: user.email,
                username: user.displayName || "",
                profile_pic: user.photoURL || null
            })
        });
    };

    // delete user from PostgreSQL backend
    const deleteUserFromBackend = async (firebase_uid: string) => {
        return await sendRequest({
            url: `${process.env.REACT_APP_BACKEND_URL}/auth/${firebase_uid}`,
            method: "DELETE"
        });
    };

    // login with email
    const logInWithEmail = (email: string, password: string) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // login with google
    const googleProvider = new GoogleAuthProvider();

    const logInWithGoogle = () => {
        return signInWithPopup(auth, googleProvider);
    };

    // logout
    const logOut = () => {
        return signOut(auth);
    };

    // change password and sync to backend
    const changePassword = async (newPassword: string) => {
        const user = auth.currentUser;
        if (!user) throw new Error("No user is currently signed in.");

        await updatePassword(user, newPassword);

        // Re-sync in case you want to log this or update timestamps
        return await syncUserWithBackend(user);
    };

    // delete account (Firebase + Postgres)
    const deleteAccount = async () => {
        const user = auth.currentUser;
        if (!user) throw new Error("No user is currently signed in.");

        const uid = user.uid;

        await deleteUser(user); // Firebase
        return await deleteUserFromBackend(uid); // PostgreSQL
    };

    // auth state change for context
    const onAuthChange = (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, callback);
    };

    return {
        signUpWithEmail,
        syncUserWithBackend,
        logInWithEmail,
        logInWithGoogle,
        logOut,
        changePassword,
        deleteAccount,
        onAuthChange,
        isLoadingAuth: isLoading, hasError, clearError
    };
};
