"use client";

type ClearButton1Props = {
    onClear: () => void;
};

/**
 * Resets the theme-style form.
 *
 * The template version did the reset twice over: it called `onClear` through
 * React *and* attached a raw DOM listener that stripped the `dark-theme` class
 * off document.body and force-checked a radio input. ThemeSwitch owns dark mode
 * in React state, so the next render put the class straight back and the reset
 * visibly undid itself. The listener also cleared a `toggled` localStorage key
 * that nothing in the app ever writes.
 *
 * Dark/light is deliberately left alone here — it belongs to ThemeSwitch, not
 * to this form, which covers layout width, menu style and positions.
 */
export default function ClearButton1({ onClear }: ClearButton1Props) {
    return (
        <button
            type="button"
            className="tf-button cursor-pointer w-full button-clear-select"
            onClick={onClear}
        >
            Clear all
        </button>
    );
}
