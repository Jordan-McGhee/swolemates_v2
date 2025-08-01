// imports
import { User } from "firebase/auth";
import { ReactNode } from "react";

// APP DATA TYPES
export interface PostgreSQLUser {
    user_id: number;
    username: string;
    email: string;
    bio?: string;
    profile_pic?: string;
    is_private?: boolean;
    firebase_uid: string;
    created_at: Date;
    updated_at: Date;
}

export interface Post {
    type?: 'post';
    post_id: number;
    user_id: number;
    username: string;
    profile_pic?: string;
    content: string;
    image_url?: string;
    workout_id?: number;
    workout_title?: string;
    group_id?: number;
    group_name?: string;
    group_profile_pic?: string;
    created_at: Date;
    updated_at: Date;
    likes?: Like[];
    likes_count?: number;
    comments?: Comment[];
    comments_count?: number;
}

export interface PostItemProps {
    user: PostgreSQLUser | null;
    post: Post;
}

export interface Comment {
    comment_id: number;
    user_id: number;
    post_id?: number;
    workout_id?: number;
    // username: string;
    // profile_pic?: string;
    content: string;
    created_at: Date;
    updated_at: Date;
}

export interface AddCommentFormProps {
    postId: number;
    onCommentAdded?: (comment: Comment) => void;
}

export interface Like {
    like_id: number;
    user_id: number;
    post_id?: number;
    workout_id?: number;
    comment_id?: number;
    created_at: Date;
}


export interface Workout {
    type?: 'workout';
    workout_id: number;
    user_id: string;
    title: string;
    description?: string;
    exercises: Exercise[];
    created_at: Date;
    updated_at: Date;
}
export interface Exercise {
    exercise_id: number;
    title: string;
    weight_used: number;
    set_count: number;
    rep_count: number;
    duration?: number; // Optional for cardio exercises
    created_at: Date;
}

export interface Group { }

// modal props
export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    modalClassName?: string;
}

export interface AuthModalProps {
    onClose: () => void;
    isOpen: boolean;
    onAuthSuccess?: () => void;
}

export interface ErrorModalProps {
    error?: string | null;
    onClear: () => void;
}

export interface MobileBottomProps {
    onLoginClick: () => void;
}

// AUTH TYPES
export interface AuthInputProps {
    name: string;
    label: string;
    placeholder?: string;
    isPassword?: boolean;
    value: string;
    onBlur?: () => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    validate?: (value: string) => void;
    isLoading?: boolean;
    isAvailable?: boolean | null;
    type?: string;
    error?: string;
    required?: boolean;
}

export interface AuthFormProps {
    onAuthSuccess?: () => void;
}

export interface AuthContextValue {
    user: PostgreSQLUser | null;
    firebaseUser: User | null;
    token?: string | null;
    isAuthLoading: boolean;
    hasError: string | null;
    clearError: () => void;
    checkUsernameAvailability: (username: string) => Promise<boolean>;
    checkEmailAvailability: (email: string) => Promise<boolean>;
    handleSignUp: (email: string, password: string, username: string) => Promise<void>;
    handleLoginEmail: (email: string, password: string) => Promise<void>;
    handleLoginGoogle: () => Promise<void>;
    handleUpdateUserProfile: (updates: Partial<PostgreSQLUser>) => Promise<PostgreSQLUser>;
    handleLogout: () => Promise<void>;
    handleDeleteAccount: () => Promise<void>;
    syncUserWithBackend: (user: User) => Promise<any>;
}

export interface AuthProviderProps {
    children: ReactNode;
}

// SIDEBAR TYPES
export interface AppSidebarProps {
    onLoginClick: () => void;
}

// PROFILE TYPES
export interface ProfileHeaderProps {
    user: PostgreSQLUser | null;
    isLoading: boolean;
    isOwnProfile?: boolean;
    headerCounts?: {
        post_count: number;
        workout_count: number;
        friend_count: number;
    };
    changeMenuItem?: (item: ProfileMenuItem) => void | undefined;
}

export type ProfileMenuItem = "feed" | "posts" | "workouts" | "friends" | "groups";

export interface ProfileMenuBarProps {
    selectedMenuItem: ProfileMenuItem;
    onMenuItemClick: (item: ProfileMenuItem) => void;
}

export type FeedItem = Post | Workout;

export type Feed = FeedItem[];

export interface ProfileViewProps {
    user: PostgreSQLUser | null;
    isLoading: boolean;
    isOwnProfile?: boolean;
}

export interface ProfileFeedProps {
    user: PostgreSQLUser | null;
    feedType?: "default" | "posts" | "workouts";
}

export interface UserFeedResponse {
    message: string;
    feed: Array<{
        user_id: number;
        username: string;
        profile_pic: string;
        feed_items: FeedItem[];
        post_count: number;
        workout_count: number;
    }>;
    username: string;
    limit: number;
    offset: number;
}

export interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    // onLogout: () => void;
    // onProfileUpdate: (data: { username: string; bio: string; privacy: boolean }) => void;
    // onDeleteAccount: () => void;
}

export interface ProfileEditFormProps {
    onClose?: () => void;
    onBack: () => void;
}

// POST TYPES
export interface CreatePostProps {
    workouts?: Workout[];
}