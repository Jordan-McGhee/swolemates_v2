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
    likes?: Like[];
    likes_count?: number;
    comments?: Comment[];
    comments_count?: number;
    created_at: Date;
    updated_at: Date;
}

export interface Comment {
    comment_id: number;
    user_id: number;
    username: string;
    profile_pic?: string;
    post_id?: number;
    workout_id?: number;
    session_id?: number;
    // username: string;
    // profile_pic?: string;
    content: string;
    likes?: Like[];
    created_at: Date;
    updated_at: Date;
}

export interface AddCommentFormProps {
    post_id?: number;
    workout_id?: number;
    session_id?: number;
    onCommentAdded?: (comment: Comment) => void;
}

export interface Like {
    like_id: number;
    user_id: number;
    username?: string;
    profile_pic?: string;
    post_id?: number;
    workout_id?: number;
    comment_id?: number;
    created_at: Date;
}

// Enums for workout and exercise types
export type WorkoutType = 'strength' | 'cardio' | 'hiit' | 'run' | 'yoga' | 'stretching' | 'swimming' | 'cycling' | 'crossfit' | 'bodyweight' | 'other';
export type ExerciseType = 'strength' | 'cardio' | 'stretch' | 'plyometric' | 'balance' | 'flexibility' | 'endurance' | 'other';
export type MeasurementType = 'reps' | 'duration' | 'distance';

// Exercise library/database
export interface Exercise {
    exercise_id: number;
    title: string;
    exercise_type: ExerciseType;
    measurement_type: MeasurementType;
    created_at?: Date;
    updated_at?: Date;
}

// Core workout template
export interface Workout {
    type?: 'workout';
    workout_id: number;
    user_id: number;
    workout_title: string;
    workout_description?: string;
    workout_type: WorkoutType;
    exercises: WorkoutFormExercise[];
    likes?: Like[];
    likes_count?: number;
    comments?: Comment[];
    comments_count?: number;
    created_at: Date;
    updated_at: Date;
}

// Junction table for workout templates
export interface WorkoutExercise {
    workout_id: number;
    exercise_id: number;
    exercise?: Exercise;
    sets?: number;
    reps?: number;
    duration_seconds?: number;
    distance_miles?: number;
    created_at?: Date;
}

// For creating/editing workouts
export interface WorkoutFormExercise {
    title: string;
    exercise_type: ExerciseType;
    measurement_type: MeasurementType;
    sets?: number;
    reps?: number;
    duration_seconds?: number;
    distance_miles?: number;
}

// Completed workout session
export interface WorkoutSession {
    type?: 'session';
    session_id: number;
    workout_id: number;
    user_id: number;
    duration_minutes?: number;
    total_distance_miles?: number;
    notes?: string;
    difficulty?: number; // 1-5
    likes?: Like[];
    likes_count?: number;
    comments?: Comment[];
    comments_count?: number;
    created_at: Date;
    exercises: SessionExercise[];
}

// Actual exercise performance in a session
export interface SessionExercise {
    session_exercise_id: number;
    session_id: number;
    exercise_id: number;
    exercise?: Exercise;
    weight_used?: number;
    sets_completed?: number;
    reps_completed?: number;
    duration_seconds?: number;
    distance_miles?: number;
    pace_minutes_per_mile?: string;
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

export type ProfileMenuItem = "feed" | "posts" | "workouts" | "sessions" | "friends" | "groups";

export interface ProfileMenuBarProps {
    selectedMenuItem: ProfileMenuItem;
    onMenuItemClick: (item: ProfileMenuItem) => void;
}

export type FeedItem = Post | Workout | WorkoutSession;

export type Feed = FeedItem[];

export interface ProfileViewProps {
    user: PostgreSQLUser | null;
    isLoading: boolean;
    isOwnProfile?: boolean;
}

export interface ProfileFeedProps {
    user: PostgreSQLUser | null;
    feedType?: "default" | "posts" | "workouts" | "sessions";
}

export interface LikeCommentButtonsProps {
    liked: boolean | undefined;
    likesCount: number;
    commentsCount: number;
    onLikeToggle: () => void;
    onLikeClickMobile?: () => void;
    onLikeClickDesktop?: () => void;
    onCommentClick?: () => void;
    disabled?: boolean;
    hideComments?: boolean;
};

export interface PostItemProps {
    user: PostgreSQLUser | null;
    post: Post;
}

export interface WorkoutItemProps {
    user: PostgreSQLUser | null;
    workout: Workout;
}

export interface SessionItemProps {
    user: PostgreSQLUser | null;
    session: WorkoutSession;
}

export interface CommentItemProps {
    comment: Comment;
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

export interface ViewPostItemProps {
    onLikesUpdate?: (updatedLikes: Like[]) => void;
}

export interface ViewPostLikesProps {
    likes: Like[];
}

// WORKOUT TYPES

// WORKOUT FORM TYPES
export interface ExerciseInputProps {
    exerciseIndex: number;
    handleExerciseChange: (index: number, updatedExercise: WorkoutFormExercise) => void;
    handleDeleteExercise: () => void;
    handleExerciseError: (index: number, hasError: boolean) => void;
}