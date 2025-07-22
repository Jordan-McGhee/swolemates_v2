import React from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

// type imports
import { ErrorModalProps } from "@/types/props/props-types";

const ErrorModal: React.FC<ErrorModalProps> = ({ error, onClear }) => {
    return (
        <Modal isOpen={!!error} onClose={onClear}>

            <div className="w-full p-4 flex flex-col items-center justify-center gap-2 text-center">
                <h2 className="text-xl font-bold text-[var(--danger)] mb-2">
                    Something went wrong!
                </h2>
                <div className="text-[var(--subhead-text)] mb-4">{error}</div>
                <Button className="w-full text-white bg-[var(--danger)]" onClick={onClear}>
                    Close
                </Button>
            </div>

        </Modal>
    );
};

export default ErrorModal;
