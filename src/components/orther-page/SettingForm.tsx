"use client";

import { FormEvent, useEffect, useState } from "react";

/**
 * The signed-in user's own profile.
 *
 * The template version posted firstName/lastName/address/role plus Google and
 * Facebook OAuth client IDs and secret keys. None of those fields existed on
 * the API, so the form reported "saved" while silently discarding almost
 * everything — and the social-login toggles had no integration behind them at
 * all. This form now sends exactly what /api/settings/profile accepts.
 */
export default function SettingForm() {
    const [loading, setLoading] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    useEffect(() => {
        let cancelled = false;
        fetch("/api/settings/profile")
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load your profile"))))
            .then((d) => {
                if (cancelled) return;
                setName(d.name ?? "");
                setEmail(d.email ?? "");
                setRole(d.role === "owner" ? "Owner" : "Staff");
            })
            .catch((err) => !cancelled && setError(err.message))
            .finally(() => !cancelled && setLoadingProfile(false));
        return () => {
            cancelled = true;
        };
    }, []);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setNotice(null);

        if (!name.trim()) return setError("Name is required");
        if (newPassword && newPassword.length < 8) {
            return setError("New password must be at least 8 characters");
        }
        if (newPassword && !currentPassword) {
            return setError("Enter your current password to change it");
        }

        setLoading(true);
        try {
            const res = await fetch("/api/settings/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    ...(newPassword ? { currentPassword, newPassword } : {}),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not save your profile");

            setNotice("Profile saved.");
            setCurrentPassword("");
            setNewPassword("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    if (loadingProfile) {
        return (
            <div className="wg-box">
                <div className="body-text" style={{ padding: "40px 0", textAlign: "center" }}>
                    Loading your profile…
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <div className="wg-box mb-20">
                    <div className="body-text" style={{ color: "#e53e3e" }}>{error}</div>
                </div>
            )}
            {notice && (
                <div className="wg-box mb-20">
                    <div className="body-text" style={{ color: "#0f993e" }}>{notice}</div>
                </div>
            )}

            <div className="wg-box mb-30">
                <h5 className="mb-20">Your details</h5>

                <fieldset className="mb-20">
                    <div className="body-title mb-10">
                        Name <span className="tf-color-1">*</span>
                    </div>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </fieldset>

                <fieldset className="mb-20">
                    <div className="body-title mb-10">
                        Email <span className="tf-color-1">*</span>
                    </div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <div className="text-tiny mt-10">This is the address you sign in with.</div>
                </fieldset>

                <fieldset>
                    <div className="body-title mb-10">Role</div>
                    <input type="text" value={role} readOnly disabled />
                    <div className="text-tiny mt-10">
                        Roles are managed under Users by an owner.
                    </div>
                </fieldset>
            </div>

            <div className="wg-box mb-30">
                <h5 className="mb-20">Change password</h5>
                <div className="text-tiny mb-20">Leave blank to keep your current password.</div>

                <fieldset className="mb-20">
                    <div className="body-title mb-10">Current password</div>
                    <input
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                </fieldset>

                <fieldset>
                    <div className="body-title mb-10">New password</div>
                    <input
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <div className="text-tiny mt-10">At least 8 characters.</div>
                </fieldset>
            </div>

            <div className="cols gap10">
                <button className="tf-button w-full" type="submit" disabled={loading}>
                    {loading ? "Saving…" : "Save changes"}
                </button>
            </div>
        </form>
    );
}
