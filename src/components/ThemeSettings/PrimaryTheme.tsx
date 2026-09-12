'use client'

export type PrimaryThemeColor =
    | 'FF7433'
    | '2377FC'
    | '35988D'
    | '7047D6'
    | '189D72'

type PrimaryThemeProps = {
    value: PrimaryThemeColor
    onChange: (value: PrimaryThemeColor) => void
}

export default function PrimaryTheme({
    value,
    onChange,
}: PrimaryThemeProps) {
    return (
        <fieldset>
            <div className="body-title mb-10">Theme Primary color</div>

            <div className="select-colors-theme colors-theme-primary mb-10">
                <div
                    className={`item color-FF7433 ${value === 'FF7433' ? 'active' : ''}`}
                    onClick={() => onChange('FF7433')}
                />
                <div
                    className={`item color-2377FC ${value === '2377FC' ? 'active' : ''}`}
                    onClick={() => onChange('2377FC')}
                />
                <div
                    className={`item color-35988D ${value === '35988D' ? 'active' : ''}`}
                    onClick={() => onChange('35988D')}
                />
                <div
                    className={`item color-7047D6 ${value === '7047D6' ? 'active' : ''}`}
                    onClick={() => onChange('7047D6')}
                />
                <div
                    className={`item color-189D72 ${value === '189D72' ? 'active' : ''}`}
                    onClick={() => onChange('189D72')}
                />
            </div>
        </fieldset>
    )
}