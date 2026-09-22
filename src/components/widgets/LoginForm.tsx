"use client";

import React, { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get("from") || "/";
    const [showPassword, setShowPassword] = useState(false);
    const [keepSignedIn, setKeepSignedIn] = useState(false);
    const [loading, setLoading] = useState(false);
    // shown in the form itself — a browser alert() is not an error message
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
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
                setError(data.message || "That email and password do not match.");
                return;
            }

            router.push(from);
            router.refresh();
        } catch (err) {
            console.error(err);
            setError("Could not reach the server. Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="right">
                <div className="login-box">
                    <div className="login-brand">
                        <Image src="/images/logo/logo.png" alt="Soft & Comfort" width={150} height={70} priority />
                    </div>

                    <form
                        className="form-login flex flex-column gap22 w-full"
                        onSubmit={handleSubmit}
                    >
                        <div>
                            <h3>Sign in</h3>
                            <div className="body-text mb-5">
                                Manage your store — products, orders and settings.
                            </div>
                        </div>

                        {error && (
                            <div className="login-error" role="alert">
                                {error}
                            </div>
                        )}

                        <fieldset className="email">
                            <div className="body-title mb-10">
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
                            <div className="body-title mb-10">
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
                                    className="body-text"
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
                            {loading ? "Signing in…" : "Sign in"}
                        </button>
                    </form>


                </div>
            </div>
        </div>
    );
}
