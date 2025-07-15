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
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    error?: string;
    required?: boolean;
}

export interface AuthModalProps {
    onClose: () => void;
    isOpen: boolean;
}

// SIDEBAR TYPES
export interface AppSidebarProps {
    onLoginClick: () => void;
}