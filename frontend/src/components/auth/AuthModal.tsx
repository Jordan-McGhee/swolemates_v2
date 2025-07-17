import { Modal } from "@/components/ui/modal";
import AuthForm from "@/components/auth/AuthForm";

// types
import { AuthModalProps } from "@/types/props/props-types";

export default function AuthModal({ onClose }: AuthModalProps) {
    return (
        <Modal
            onClose={onClose}
            isOpen={true}
        >
            <div className="flex flex-col items-center w-full max-w-md p-4">
                <AuthForm onAuthSuccess={onClose} />
            </div>
        </Modal>
    );
}
