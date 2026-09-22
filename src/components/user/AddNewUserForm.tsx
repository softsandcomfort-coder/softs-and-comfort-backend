"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Create a dashboard account.
 *
 * The template version offered Allow/Deny radios for `addProduct`,
 * `updateProduct`, `deleteProduct`, `applyDiscount` and `createCoupon` — none of
 * which the app enforces. Worse, it posted them as an object of strings and the
 * API kept every truthy value, so `"deny"` granted the permission. These are the
 * five keys `can()` actually checks, sent as a plain array.
 */

const PERMISSIONS = [
    { key: "products", label: "Products", hint: "Create, edit and delete products and attributes" },
    { key: "categories", label: "Categories", hint: "Create, edit and delete categories" },
    { key: "orders", label: "Orders", hint: "View orders and change their status" },
    { key: "marketing", label: "Promo codes & reviews", hint: "Create discount codes and publish customer reviews" },
    { key: "users", label: "Users", hint: "Create and remove dashboard accounts" },
    { key: "settings", label: "Store settings", hint: "Edit store details, currency and shipping" },
] as const;

export default function AddNewUserForm() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<"staff" | "owner">("staff");
    const [permissions, setPermissions] = useState<string[]>(["products", "orders"]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const togglePermission = (key: string) =>
        setPermissions((prev) =>
            prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
        );

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!name.trim()) return setError("Name is required");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return setError("Enter a valid email address");
        }
        // matches the API, which rejects anything shorter
        if (password.length < 8) return setError("Password must be at least 8 characters");
        if (password !== confirmPassword) return setError("Passwords do not match");

        setSaving(true);
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    confirmPassword,
                    role,
                    // owners always have full access, so permissions are irrelevant for them
                    permissions: role === "owner" ? [] : permissions,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not create the account");

            router.push("/all-user");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className="form-add-new-user" onSubmit={handleSubmit}>
            {error && (
                <div className="wg-box mb-20">
                    <div className="body-text" style={{ color: "#e53e3e" }}>{error}</div>
                </div>
            )}

            <div className="wg-box mb-30">
                <h5 className="mb-20">Account</h5>

                <fieldset className="mb-20">
                    <div className="body-title mb-10">
                        Name <span className="tf-color-1">*</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </fieldset>

                <fieldset className="mb-20">
                    <div className="body-title mb-10">
                        Email <span className="tf-color-1">*</span>
                    </div>
                    <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <div className="text-tiny mt-10">They will sign in with this address.</div>
                </fieldset>

                <div className="cols-lg gap22">
                    <fieldset>
                        <div className="body-title mb-10">
                            Password <span className="tf-color-1">*</span>
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <div className="text-tiny mt-10">At least 8 characters.</div>
                    </fieldset>

                    <fieldset>
                        <div className="body-title mb-10">
                            Confirm password <span className="tf-color-1">*</span>
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </fieldset>
                </div>

                <label className="flex items-center gap10 mt-20" style={{ cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                    />
                    <span className="text-tiny">Show passwords</span>
                </label>
            </div>

            <div className="wg-box mb-30">
                <h5 className="mb-20">Role &amp; permissions</h5>

                <fieldset className="mb-20">
                    <div className="body-title mb-10">Role</div>
                    <select value={role} onChange={(e) => setRole(e.target.value as "staff" | "owner")}>
                        <option value="staff">Staff — access limited to the permissions below</option>
                        <option value="owner">Owner — full access to everything</option>
                    </select>
                </fieldset>

                {role === "staff" ? (
                    <fieldset>
                        <div className="body-title mb-10">Permissions</div>
                        <div className="text-tiny mb-20">
                            What this account is allowed to manage. Everything else is refused by
                            the server, not just hidden.
                        </div>
                        {PERMISSIONS.map((p) => (
                            <label
                                key={p.key}
                                className="flex items-center gap10 mb-14"
                                style={{ cursor: "pointer" }}
                            >
                                <input
                                    type="checkbox"
                                    checked={permissions.includes(p.key)}
                                    onChange={() => togglePermission(p.key)}
                                />
                                <span>
                                    <span className="body-title-2">{p.label}</span>
                                    <span className="text-tiny" style={{ display: "block" }}>
                                        {p.hint}
                                    </span>
                                </span>
                            </label>
                        ))}
                    </fieldset>
                ) : (
                    <div className="body-text" style={{ opacity: 0.75 }}>
                        Owners bypass the permission list entirely.
                    </div>
                )}
            </div>

            <div className="cols gap10">
                <button className="tf-button w380" type="submit" disabled={saving}>
                    {saving ? "Creating…" : "Create account"}
                </button>
                <Link href="/all-user" className="tf-button style-3 w380">
                    Cancel
                </Link>
            </div>
        </form>
    );
}
