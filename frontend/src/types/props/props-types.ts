// imports
import { User } from "firebase/auth";
import { ReactNode } from "react";

// modal props
export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    modalClassName?: string;
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

export interface AuthModalProps {
    onClose: () => void;
    isOpen: boolean;
}

export interface AuthContextValue {
    user: User | null;
    isAuthLoading: boolean;
    hasError: string | null;
    clearError: () => void;
    checkUsernameAvailability: (username: string) => Promise<boolean>;
    checkEmailAvailability: (email: string) => Promise<boolean>;
    handleSignUp: (email: string, password: string, username: string) => Promise<void>;
    handleLoginEmail: (email: string, password: string) => Promise<void>;
    handleLoginGoogle: () => Promise<void>;
    handleLogout: () => Promise<void>;
    syncUserWithBackend: (user: User) => Promise<any>;
}

export interface AuthProviderProps {
    children: ReactNode;
}

// SIDEBAR TYPES
export interface AppSidebarProps {
    onLoginClick: () => void;
}