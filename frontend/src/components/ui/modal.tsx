import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// types
import { ModalProps } from "@/types/props/props-types";

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, modalClassName }) => {

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-999 bg-black bg-opacity-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: .9 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal content */}
                    <motion.div
                        className="fixed inset-0 z-9999 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className={modalClassName || "relative max-w-sm w-full bg-white rounded-lg shadow-lg p-6"}
                            role="dialog"
                            aria-modal="true"
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            // Prevent clicks on the modal from closing it
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                aria-label="Close modal"
                                className="absolute top-3 right-3 hover:cursor-pointer text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>

                            {children}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
