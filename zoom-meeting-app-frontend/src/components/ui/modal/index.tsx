import { useState, ReactNode } from "react";
import { motion } from "framer-motion";

// Type definition for Modal props
type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
};

// Reusable Modal component that accepts children
const Modal = ({ isOpen, onClose, children }: ModalProps) => {
    if (!isOpen) return null; // Prevent rendering when modal is closed

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-gray-800 p-1 rounded-xl shadow-lg max-w-sm w-full"
            >
                {children} {/* Render any children inside the modal */}
            </motion.div>
        </div>
    );
};

export { Modal };