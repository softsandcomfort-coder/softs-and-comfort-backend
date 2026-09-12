import React, { Suspense } from "react";
import LoginForm from "@/components/widgets/LoginForm";

export const metadata = {
    title: "Sign in — Velorra Admin",
    description: "Sign in — Velorra Admin",
};

export default function page() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
