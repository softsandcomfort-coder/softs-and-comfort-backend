'use client'

type HeaderPositionProps = {
    value: 'fixed' | 'scrollable'
    onChange: (value: 'fixed' | 'scrollable') => void
}

const HeaderPosition = ({ value, onChange }: HeaderPositionProps) => {
    return (
        <fieldset className="header-position">
            <div className="body-title mb-5">Header positions</div>
            <div className="radio-buttons">
                <div className="item">
                    <input
                        className="header-fixed"
                        type="radio"
                        name="header-positions"
                        id="header-positions1"
                        checked={value === 'fixed'}
                        onChange={() => onChange('fixed')}
                    />
                    <label htmlFor="header-positions1">
                        <div className="body-title">Fixed</div>
                    </label>
                </div>

                <div className="item">
                    <input
                        className="header-scrollable"
                        type="radio"
                        name="header-positions"
                        id="header-positions2"
                        checked={value === 'scrollable'}
                        onChange={() => onChange('scrollable')}
                    />
                    <label htmlFor="header-positions2">
                        <div className="body-title">Scrollable</div>
                    </label>
                </div>
            </div>
        </fieldset>
    )
}

export default HeaderPosition