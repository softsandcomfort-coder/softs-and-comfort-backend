"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FullScreenButton from "../elements/FullScreenButton";

const ThemeSwitch = dynamic(() => import("../elements/ThemeSwitch"), {
    ssr: false,
});

/**
 * Dashboard header.
 *
 * The template version carried a search box that submitted nowhere, a language
 * switcher with no i18n behind it, hardcoded notification and message feeds,
 * and a "Related apps" grid where every entry was href="#". All of it is gone
 * rather than left as decoration — a control that looks clickable and does
 * nothing is worse than no control at all.
 *
 * What remains is only what works: the sidebar toggle, theme switch, fullscreen,
 * the real signed-in account, and sign out.
 */
export type Header1Props = {
    isSidebar?: boolean;
    handleSidebar: () => void;
    handleOffcanvas: () => void;
};

type Account = { name: string; email: string; role: string };

export default function Header1({
    isSidebar: _isSidebar,
    handleSidebar,
    handleOffcanvas,
}: Header1Props) {
    const router = useRouter();
    const [account, setAccount] = useState<Account | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/settings/profile")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!cancelled && d?.name) {
                    setAccount({
                        name: d.name,
                        email: d.email ?? "",
                        role: d.role === "owner" ? "Owner" : "Staff",
                    });
                }
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, []);

    // close the account menu on any outside click
    useEffect(() => {
        if (!menuOpen) return;
        const close = () => setMenuOpen(false);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, [menuOpen]);

    const handleLogout = async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="header-dashboard">
            <div className="wrap">
                <div className="header-left">
                    <Link href="/">
                        <Image
                            id="logo_header_mobile"
                            alt="Soft & Comfort"
                            src="/images/logo/logo.png"
                            width={132}
                            height={61}
                            data-light="/images/logo/logo.png"
                            data-dark="/images/logo/logo-white.png"
                            priority
                        />
                    </Link>
                    <div className="button-show-hide" onClick={handleSidebar}>
                        <i className="icon-chevron-left" />
                    </div>
                </div>

                <div className="header-grid">
                    <ThemeSwitch />
                    <FullScreenButton />

                    <div className="popup-wrap user type-header">
                        <div className="dropdown">
                            <button
                                className="btn btn-secondary dropdown-toggle"
                                type="button"
                                aria-expanded={menuOpen}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen((open) => !open);
                                }}
                            >
                                <span className="header-user wg-user">
                                    <span className="image">
                                        <Image
                                            src="/images/avatar/user-1.png"
                                            alt=""
                                            width={40}
                                            height={40}
                                            className="object-cover rounded-full"
                                        />
                                    </span>
                                    <span className="flex flex-column">
                                        <span className="name mb-2">
                                            {account?.name ?? "Account"}
                                        </span>
                                        <span className="text-tiny">{account?.role ?? ""}</span>
                                    </span>
                                </span>
                            </button>

                            <div
                                className={`dropdown-menu dropdown-menu-end has-content${menuOpen ? " show" : ""}`}
                                role="region"
                                aria-label="Account menu"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Link href="/setting" className="user-item">
                                    <div className="icon">
                                        <i className="icon-user" />
                                    </div>
                                    <div className="body-title-2">My profile</div>
                                </Link>
                                <Link href="/store-setting" className="user-item">
                                    <div className="icon">
                                        <i className="icon-settings" />
                                    </div>
                                    <div className="body-title-2">Store settings</div>
                                </Link>
                                <button
                                    type="button"
                                    className="user-item"
                                    onClick={handleLogout}
                                    style={{
                                        width: "100%",
                                        background: "none",
                                        border: 0,
                                        textAlign: "left",
                                    }}
                                >
                                    <div className="icon">
                                        <i className="icon-log-out" />
                                    </div>
                                    <div className="body-title-2">Log out</div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="divider" />

                    <div className="setting cursor-pointer" onClick={handleOffcanvas}>
                        <i className="icon-settings" />
                    </div>
                </div>
            </div>
        </div>
    );
}
