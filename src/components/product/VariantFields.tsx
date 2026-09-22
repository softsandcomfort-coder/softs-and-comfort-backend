"use client";

import { KeyboardEvent, useState } from "react";

/**
 * Sizes and colours for the product form.
 *
 * Both are free-form: common sizes are one click away, but any label can be
 * typed in (bra sizes, waist sizes, "Free Size"…). A colour is added with a
 * name plus a picker, a hex code or R/G/B values — all three stay in sync.
 */

export type ColorValue = { name: string; hex: string };

const SIZE_GROUPS: { label: string; sizes: string[] }[] = [
    { label: "Clothing", sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
    { label: "Bra", sizes: ["32B", "34B", "36B", "38B", "32C", "34C", "36C", "38C"] },
    { label: "Waist", sizes: ["28", "30", "32", "34", "36", "38", "40"] },
    { label: "Other", sizes: ["Free Size"] },
];

const COLOR_PRESETS: ColorValue[] = [
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Skin", hex: "#E8C4A8" },
    { name: "Navy", hex: "#0A2472" },
    { name: "Grey", hex: "#8E8E8E" },
    { name: "Blush", hex: "#FEC4C4" },
    { name: "Rose", hex: "#FF4A76" },
    { name: "Maroon", hex: "#7A1F2B" },
    { name: "Sky", hex: "#9BD1FF" },
    { name: "Lilac", hex: "#B77CF3" },
];

const HEX_RE = /^#?([0-9a-f]{6})$/i;

function normaliseHex(value: string): string | null {
    const m = value.trim().match(HEX_RE);
    return m ? `#${m[1].toUpperCase()}` : null;
}

function hexToRgb(hex: string): [number, number, number] {
    const n = Number.parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

const clampByte = (v: string) => Math.max(0, Math.min(255, Number.parseInt(v || "0", 10) || 0));

const chip: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px 6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,.15)",
    background: "#fff",
    fontSize: 14,
};

const removeBtn: React.CSSProperties = {
    border: 0,
    background: "transparent",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
    padding: 0,
    color: "#888",
};

export function SizeField({ sizes, onChange }: { sizes: string[]; onChange: (next: string[]) => void }) {
    const [custom, setCustom] = useState("");

    const has = (s: string) => sizes.some((x) => x.toLowerCase() === s.toLowerCase());
    const toggle = (s: string) => onChange(has(s) ? sizes.filter((x) => x.toLowerCase() !== s.toLowerCase()) : [...sizes, s]);

    const addCustom = () => {
        // "S, M, L" adds three at once
        const parts = custom.split(",").map((p) => p.trim().slice(0, 20)).filter(Boolean);
        const fresh = parts.filter((p, i) => !has(p) && parts.findIndex((q) => q.toLowerCase() === p.toLowerCase()) === i);
        if (fresh.length) onChange([...sizes, ...fresh]);
        setCustom("");
    };
    const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault(); // don't submit the product form
            addCustom();
        }
    };

    return (
        <fieldset>
            <div className="body-title mb-10">Sizes</div>

            <div className="flex gap10 mb-10" style={{ alignItems: "stretch" }}>
                <input
                    type="text"
                    placeholder="Type a size, e.g. 34B or Free Size — press Enter"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={onKey}
                />
                <button type="button" className="tf-button style-1" onClick={addCustom} style={{ whiteSpace: "nowrap" }}>
                    Add size
                </button>
            </div>

            {SIZE_GROUPS.map((group) => (
                <div key={group.label} className="flex gap10 flex-wrap mb-10" style={{ alignItems: "center" }}>
                    <span className="text-tiny" style={{ width: 56 }}>{group.label}</span>
                    {group.sizes.map((size) => (
                        <button
                            key={size}
                            type="button"
                            onClick={() => toggle(size)}
                            className={has(size) ? "tf-button" : "tf-button style-3"}
                            style={{ minWidth: 52, height: 36, padding: "0 12px" }}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            ))}

            {sizes.length > 0 ? (
                <div className="flex gap10 flex-wrap mt-10">
                    {sizes.map((size, i) => (
                        <span key={size} style={chip}>
                            {size}
                            <button type="button" style={removeBtn} aria-label={`Remove ${size}`} onClick={() => onChange(sizes.filter((_, j) => j !== i))}>
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            ) : (
                <div className="text-tiny mt-10">No sizes yet — click a preset or type your own.</div>
            )}
            <div className="text-tiny mt-10">Shown on the product page in this order, and used by the shop&apos;s size filter.</div>
        </fieldset>
    );
}

export function ColorField({ colors, onChange }: { colors: ColorValue[]; onChange: (next: ColorValue[]) => void }) {
    const [name, setName] = useState("");
    const [hex, setHex] = useState("#E8C4A8");
    const [hexText, setHexText] = useState("#E8C4A8");
    const [rgb, setRgb] = useState<[string, string, string]>(() => hexToRgb("#E8C4A8").map(String) as [string, string, string]);
    const [error, setError] = useState<string | null>(null);

    const setAll = (next: string) => {
        setHex(next);
        setHexText(next);
        setRgb(hexToRgb(next).map(String) as [string, string, string]);
    };

    const onHexText = (value: string) => {
        setHexText(value);
        const valid = normaliseHex(value);
        if (valid) {
            setHex(valid);
            setRgb(hexToRgb(valid).map(String) as [string, string, string]);
        }
    };

    const onRgb = (index: 0 | 1 | 2, value: string) => {
        const next = [...rgb] as [string, string, string];
        next[index] = value.replace(/[^0-9]/g, "").slice(0, 3);
        setRgb(next);
        const hexFromRgb = rgbToHex(clampByte(next[0]), clampByte(next[1]), clampByte(next[2]));
        setHex(hexFromRgb);
        setHexText(hexFromRgb);
    };

    const add = (color: ColorValue) => {
        if (colors.some((c) => c.hex === color.hex)) {
            setError(`${color.hex} is already added`);
            return;
        }
        onChange([...colors, color]);
        setError(null);
    };

    const addCurrent = () => {
        const valid = normaliseHex(hexText);
        if (!valid) {
            setError("Enter a hex code like #E8C4A8");
            return;
        }
        add({ name: name.trim() || valid, hex: valid });
        setName("");
    };

    const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addCurrent();
        }
    };

    return (
        <fieldset className="mt-20">
            <div className="body-title mb-10">Colours</div>

            <div
                className="flex gap10 flex-wrap mb-10"
                style={{ alignItems: "flex-end", padding: 14, border: "1px solid rgba(0,0,0,.1)", borderRadius: 12 }}
            >
                <label style={{ display: "grid", gap: 4 }}>
                    <span className="text-tiny">Picker</span>
                    <input
                        type="color"
                        value={hex.toLowerCase()}
                        onChange={(e) => setAll(e.target.value.toUpperCase())}
                        style={{ width: 52, height: 42, padding: 2, cursor: "pointer" }}
                        aria-label="Pick a colour"
                    />
                </label>
                <label style={{ display: "grid", gap: 4, flex: "1 1 140px" }}>
                    <span className="text-tiny">Name</span>
                    <input type="text" placeholder="e.g. Skin" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onKeyDown={onKey} />
                </label>
                <label style={{ display: "grid", gap: 4, width: 120 }}>
                    <span className="text-tiny">Hex</span>
                    <input type="text" value={hexText} maxLength={7} onChange={(e) => onHexText(e.target.value)} onKeyDown={onKey} />
                </label>
                {(["R", "G", "B"] as const).map((label, i) => (
                    <label key={label} style={{ display: "grid", gap: 4, width: 64 }}>
                        <span className="text-tiny">{label}</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={rgb[i]}
                            onChange={(e) => onRgb(i as 0 | 1 | 2, e.target.value)}
                            onKeyDown={onKey}
                        />
                    </label>
                ))}
                <span
                    aria-hidden
                    style={{ width: 42, height: 42, borderRadius: 8, background: hex, border: "1px solid rgba(0,0,0,.2)" }}
                />
                <button type="button" className="tf-button style-1" onClick={addCurrent} style={{ height: 42 }}>
                    Add colour
                </button>
            </div>
            {error && <div className="text-tiny mb-10" style={{ color: "#c62828" }}>{error}</div>}

            <div className="flex gap10 flex-wrap mb-10" style={{ alignItems: "center" }}>
                <span className="text-tiny">Quick add:</span>
                {COLOR_PRESETS.map((c) => (
                    <button
                        key={c.hex}
                        type="button"
                        title={`${c.name} ${c.hex}`}
                        aria-label={`Add ${c.name}`}
                        onClick={() => add(c)}
                        style={{
                            width: 28, height: 28, borderRadius: "50%", background: c.hex, cursor: "pointer",
                            border: "1px solid rgba(0,0,0,.25)",
                            outline: colors.some((x) => x.hex === c.hex) ? "2px solid #111" : "none",
                            outlineOffset: 2,
                        }}
                    />
                ))}
            </div>

            {colors.length > 0 ? (
                <div className="flex gap10 flex-wrap mt-10">
                    {colors.map((c) => (
                        <span key={c.hex} style={chip}>
                            <span
                                style={{
                                    width: 22, height: 22, borderRadius: "50%", background: c.hex,
                                    border: "1px solid rgba(0,0,0,.2)",
                                }}
                            />
                            <span>
                                {c.name} <span className="text-tiny">{c.hex}</span>
                            </span>
                            <button type="button" style={removeBtn} aria-label={`Remove ${c.name}`} onClick={() => onChange(colors.filter((x) => x.hex !== c.hex))}>
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            ) : (
                <div className="text-tiny mt-10">No colours yet — pick one above and press Add colour.</div>
            )}
        </fieldset>
    );
}
