"use client";
import { useEffect, useState } from "react";

type ThemeSwitchProps = {
    radioBtn?: boolean;
};

const lightLogo = "/images/logo/logo.svg";
const darkLogo = "/images/logo/logo-white.svg";

const setLogoSrc = (id: string, src: string) => {
    const el = document.getElementById(id) as HTMLImageElement | null;
    if (el) {
        el.setAttribute("src", src);
    }
};

const ThemeSwitch = ({ radioBtn }: ThemeSwitchProps) => {
    const [theme, setTheme] = useState<string>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("theme") || "light-theme";
        }
        return "light-theme";
    });

    const toggleTheme = () => {
        const newTheme = theme === "light-theme" ? "dark-theme" : "light-theme";
        setTheme(newTheme);
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("theme", theme);
        }

        if (theme === "dark-theme") {
            document.body.classList.add("dark-theme");
            document.body.classList.remove("light-theme");
        } else {
            document.body.classList.add("light-theme");
            document.body.classList.remove("dark-theme");
        }

        const logo = theme === "dark-theme" ? darkLogo : lightLogo;
        setLogoSrc("logo_header", logo);
        setLogoSrc("logo_header_mobile", logo);
    }, [theme]);

    return (
        <>
            {!radioBtn ? (
                <div
                    className="header-item button-dark-light"
                    onClick={toggleTheme}
                    role="button"
                    tabIndex={0}
                    aria-label="Toggle dark/light theme"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleTheme();
                        }
                    }}
                >
                    <i className="icon-moon" />
                </div>
            ) : (
                <div className="radio-buttons">
                    <div className="item button-dark-light light">
                        <input
                            type="radio"
                            name="mode"
                            id="mode1"
                            checked={theme === "light-theme"}
                            onChange={() => setTheme("light-theme")}
                        />
                        <label htmlFor="mode1">
                            <div className="body-title">Light</div>
                        </label>
                    </div>
                    <div className="item button-dark-light dark">
                        <input
                            type="radio"
                            name="mode"
                            id="mode2"
                            checked={theme === "dark-theme"}
                            onChange={() => setTheme("dark-theme")}
                        />
                        <label htmlFor="mode2">
                            <div className="body-title">Dark</div>
                        </label>
                    </div>
                </div>
            )}
        </>
    );
};

export default ThemeSwitch;