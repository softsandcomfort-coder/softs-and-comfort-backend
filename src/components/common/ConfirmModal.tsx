"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ConfirmModalProps = {
    open: boolean;
    title?: string;
    message?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    /** Disables the buttons while the confirmed action is in flight. */
    busy?: boolean;
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    title = "Confirm action",
    message = "Are you sure you want to continue?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    busy = false,
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onCancel();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, onCancel]);

    if (!mounted || !open) return null;

    return createPortal(
        <div className="delete-modal-overlay" onClick={onCancel}>
            <div
                className="delete-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
            >
                <div className="delete-modal-icon">
                    <i className="icon-trash-2"></i>
                </div>

                <div className="h5 mb-8">{title}</div>

                <div className="body-text mb-24">{message}</div>

                <div className="delete-modal-actions">
                    <button
                        type="button"
                        className="tf-button style-3"
                        onClick={onCancel}
                        disabled={busy}
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        className="tf-button"
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        {busy ? "Working…" : confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ConfirmModal;
