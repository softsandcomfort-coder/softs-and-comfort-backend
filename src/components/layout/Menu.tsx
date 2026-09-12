"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { dataMenu } from "@/data/dataMenu";

export default function Menu() {
    const pathname = usePathname();
    const router = useRouter();

    const defaultActiveAccordion = useMemo(() => {
        for (const section of dataMenu) {
            for (const item of section.items) {
                if (item.children?.some((sub) => sub.path === pathname)) {
                    return item.key;
                }
            }
        }
        return null;
    }, [pathname]);

    const [activeAccordion, setActiveAccordion] = useState(defaultActiveAccordion);

    const handleLogout = async () => {
        try {
            await fetch("/api/logout", { method: "POST" });
        } finally {
            router.push("/login");
            router.refresh();
        }
    };

    const handleAccordion = (key: string) => {
        setActiveAccordion((prev) => (prev === key ? null : key));
    };

    const isActive = (path?: string) => pathname === path;

    const isChildActive = (children?: { path: string }[]) =>
        children?.some((sub) => sub.path === pathname) ?? false;

    return (
        <div className="section-menu-left-wrap">
            <div className="center">
                {dataMenu.map((section, index) => (
                    <div key={index} className="center-item">
                        {section.heading && (
                            <div className="center-heading">
                                {section.heading}
                            </div>
                        )}

                        <ul className="menu-list">
                            {section.items.map((item) => {
                                const hasChildren =
                                    !!item.children && item.children.length > 0;

                                if (item.key === "logOut") {
                                    return (
                                        <li key={item.key} className="menu-item">
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleLogout();
                                                }}
                                            >
                                                <div className="icon">
                                                    {item.iconSvg ? (
                                                        item.iconSvg
                                                    ) : item.icon ? (
                                                        <i className={item.icon}></i>
                                                    ) : null}
                                                </div>
                                                <div className="text">
                                                    {item.title}
                                                </div>
                                            </a>
                                        </li>
                                    );
                                }

                                if (hasChildren) {
                                    const opened =
                                        activeAccordion === item.key ||
                                        isChildActive(item.children);

                                    return (
                                        <li
                                            key={item.key}
                                            className={`menu-item has-children ${opened ? "active" : ""}`}
                                        >
                                            <a
                                                href="#"
                                                className="menu-item-button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleAccordion(item.key);
                                                }}
                                                tabIndex={0}
                                                style={{ cursor: "pointer" }}
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === "Enter" ||
                                                        e.key === " "
                                                    ) {
                                                        e.preventDefault();
                                                        handleAccordion(item.key);
                                                    }
                                                }}
                                            >
                                                <div className="icon">
                                                    {item.iconSvg ? (
                                                        item.iconSvg
                                                    ) : item.icon ? (
                                                        <i className={item.icon}></i>
                                                    ) : null}
                                                </div>

                                                <div className="text">
                                                    {item.title}
                                                </div>
                                            </a>

                                            <ul
                                                className="sub-menu"
                                                style={{
                                                    display: opened
                                                        ? "block"
                                                        : "none",
                                                }}
                                            >
                                                {item.children.map((sub) => (
                                                    <li
                                                        key={sub.path}
                                                        className={`sub-menu-item ${isActive(sub.path) ? "active" : ""}`}
                                                    >
                                                        <Link
                                                            href={sub.path}
                                                            className={
                                                                isActive(sub.path)
                                                                    ? "active"
                                                                    : ""
                                                            }
                                                        >
                                                            <div className="text">
                                                                {sub.title}
                                                            </div>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                    );
                                }

                                return (
                                    <li
                                        key={item.key}
                                        className={`menu-item ${isActive(item.path) ? "active" : ""}`}
                                    >
                                        <Link href={item.path || "#"}>
                                            <div className="icon">
                                                {item.iconSvg ? (
                                                    item.iconSvg
                                                ) : item.icon ? (
                                                    <i className={item.icon}></i>
                                                ) : null}
                                            </div>
                                            <div className="text">
                                                {item.title}
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}

            </div>
        </div>
    );
}