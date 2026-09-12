"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import MenuStyle from "../ThemeSettings/MenuStyle";
import MenuPosition from "../ThemeSettings/MenuPosition";
import LayoutWidth from "../ThemeSettings/LayoutWidth";
import HeaderPosition from "../ThemeSettings/HeaderPosition";
import ClearButton1 from "../ThemeSettings/Clear1";
import PrimaryTheme, {
    type PrimaryThemeColor,
} from "../ThemeSettings/PrimaryTheme";


const ThemeSwitch = dynamic(() => import("../elements/ThemeSwitch"), {
    ssr: false,
});

type LayoutWidthValue = "full" | "boxed";
type SetLayoutWidth = (value: LayoutWidthValue) => void;

type OffcanvasProps = {
    isOffcanvas: boolean;
    handleOffcanvas: () => void;
    layoutWidth: LayoutWidthValue;
    setLayoutWidth: SetLayoutWidth;
    menuStyle: "menu-click" | "icon-hover" | "icon-default";
    setMenuStyle: (value: "menu-click" | "icon-hover" | "icon-default") => void;
    menuPosition: "fixed" | "scrollable";
    setMenuPosition: (value: "fixed" | "scrollable") => void;
    headerPosition: "fixed" | "scrollable";
    setHeaderPosition: (value: "fixed" | "scrollable") => void;
    onClearThemeStyle: () => void;
    primaryTheme: PrimaryThemeColor;
    setPrimaryTheme: (value: PrimaryThemeColor) => void;
    onClearThemeColors: () => void;
};

export default function Offcanvas({
    isOffcanvas,
    handleOffcanvas,
    layoutWidth,
    setLayoutWidth,
    menuStyle,
    setMenuStyle,
    menuPosition,
    setMenuPosition,
    headerPosition,
    setHeaderPosition,
    onClearThemeStyle,
    primaryTheme,
    setPrimaryTheme,
    onClearThemeColors,
}: OffcanvasProps) {
    const [isTab, setIsTab] = useState(1);

    return (
        <>
            <div
                className={`offcanvas offcanvas-end ${isOffcanvas ? "show" : ""}`}
                tabIndex={-1}
                id="offcanvasRight"
                style={{ visibility: "visible" }}
                aria-modal="true"
                role="dialog"
            >
                <div className="offcanvas-header">
                    <h6 id="offcanvasRightLabel">Setting</h6>
                    <button
                        type="button"
                        className="btn-close text-reset icon-x"
                        onClick={handleOffcanvas}
                    />
                </div>

                <div className="offcanvas-body">
                    <div className="widget-tabs">
                        <ul className="widget-menu-tab style-1">
                            <li
                                className={`item-title ${isTab === 1 ? "active" : ""}`}
                                onClick={() => setIsTab(1)}
                            >
                                <span className="inner">
                                    <div className="body-title">
                                        Theme Style
                                    </div>
                                </span>
                            </li>
                        </ul>
                        <div
                            className={`widget-content-inner ${isTab === 1 ? "active" : ""}`}
                            style={{
                                display: isTab === 1 ? "block" : "none",
                            }}
                        >
                            <form className="form-theme-style">
                                <fieldset className="theme-dark-light">
                                    <div className="body-title mb-5">
                                        Theme color mode:
                                    </div>
                                    <ThemeSwitch radioBtn />
                                </fieldset>

                                <LayoutWidth
                                    value={layoutWidth}
                                    onChange={setLayoutWidth}
                                />

                                <MenuStyle
                                    value={menuStyle}
                                    onChange={setMenuStyle}
                                />

                                <MenuPosition
                                    value={menuPosition}
                                    onChange={setMenuPosition}
                                />

                                <HeaderPosition
                                    value={headerPosition}
                                    onChange={setHeaderPosition}
                                />

                                <PrimaryTheme
                                    value={primaryTheme}
                                    onChange={setPrimaryTheme}
                                />

                                <ClearButton1 onClear={onClearThemeStyle} />
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {isOffcanvas && (
                <div
                    className="modal-backdrop fade show"
                    onClick={handleOffcanvas}
                />
            )}
        </>
    );
}
