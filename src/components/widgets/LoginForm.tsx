"use client";

import React, { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get("from") || "/";
    const [showPassword, setShowPassword] = useState(false);
    const [keepSignedIn, setKeepSignedIn] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        const email = String(formData.get("email") || "");
        const password = String(formData.get("password") || "");

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, keepSignedIn }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Login failed");
                return;
            }

            router.push(from);
            router.refresh();
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
                            <h3>Login to account</h3>
                            <div className="body-text text-white mb-5">
                                Or enter your email & password to login
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
                                required
                            />
                        </fieldset>

                        <fieldset className="password">
                            <div className="body-title mb-10 text-white">
                                Password <span className="tf-color-1">*</span>
                            </div>
                            <input
                                className="password-input"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                name="password"
                                required
                            />
                            <span
                                className="show-pass"
                                onClick={() => setShowPassword((prev) => !prev)}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="icon-eye view"></i>
                                <i className="icon-eye-off hide"></i>
                            </span>
                        </fieldset>

                        <div className="flex justify-between items-center">
                            <div className="flex gap10 items-center">
                                <input
                                    className="tf-check"
                                    type="checkbox"
                                    id="signed"
                                    checked={keepSignedIn}
                                    onChange={(e) =>
                                        setKeepSignedIn(e.target.checked)
                                    }
                                />
                                <label
                                    className="body-text text-surface-3"
                                    htmlFor="signed"
                                >
                                    Keep me signed in
                                </label>
                            </div>

                            <Link
                                href="/forgot-password"
                                className="body-text tf-color"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="tf-button w-full"
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Login"}
                        </button>
                    </form>


                </div>
            </div>
        </div>
    );
}
