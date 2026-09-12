import React, { Suspense } from "react";
import ResetPasswordForm from "@/components/widgets/RestPasswordForm";

export const metadata = {
    title: "Reset Password — Velorra Admin",
    description: "Reset Password — Velorra Admin",
};

export default function page() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}
