import React, { Suspense } from "react";
import ResetPasswordForm from "@/components/widgets/RestPasswordForm";

export const metadata = {
    title: "Reset Password — Soft & Comfort Admin",
    description: "Reset Password — Soft & Comfort Admin",
};

export default function page() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}
