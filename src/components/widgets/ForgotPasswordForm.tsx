"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = String(formData.get("email") || "");

        try {
            const res = await fetch("/api/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Something went wrong");
                return;
            }

            alert(data.message || "If the email exists, a reset link will be sent.");
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="right">
                <div className="login-box">
                    <form
                        className="form-login flex flex-column gap22 w-full"
                        onSubmit={handleSubmit}
                    >
                        <div>
                            <h3>Forgot your password</h3>
                            <div className="body-text text-white">
                                Enter your email address and we will help you
                                reset your password
                            </div>
                        </div>

                        <fieldset className="email">
                            <div className="body-title mb-10 text-white">
                                Email address{" "}
                                <span className="tf-color-1">*</span>
                            </div>
                            <input
                                className="flex-grow"
                                type="email"
                                placeholder="Enter your email address"
                                name="email"
                                tabIndex={0}
                                defaultValue=""
                                required
                            />
                        </fieldset>

                        <button
                            type="submit"
                            className="tf-button w-full"
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Send reset link"}
                        </button>
                    </form>

                    <div className="bottom body-text text-center text-white w-full">
                        Already have account?
                        <Link href="/login" className="body-text tf-color">
                            {" "}
                            Sign in here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
