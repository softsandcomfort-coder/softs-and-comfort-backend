import React, { Suspense } from "react";
import LoginForm from "@/components/widgets/LoginForm";

export const metadata = {
    title: "Sign in — Soft & Comfort Admin",
    description: "Sign in — Soft & Comfort Admin",
};

export default function page() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
