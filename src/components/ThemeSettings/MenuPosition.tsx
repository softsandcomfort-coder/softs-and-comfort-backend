'use client'

type MenuPositionProps = {
    value: 'fixed' | 'scrollable'
    onChange: (value: 'fixed' | 'scrollable') => void
}

const MenuPosition = ({ value, onChange }: MenuPositionProps) => {
    return (
        <fieldset className="menu-position">
            <div className="body-title mb-5">Menu position</div>
            <div className="radio-buttons">
                <div className="item">
                    <input
                        className="menu-fixed"
                        type="radio"
                        name="menu-position"
                        id="menu-position1"
                        checked={value === 'fixed'}
                        onChange={() => onChange('fixed')}
                    />
                    <label htmlFor="menu-position1">
                        <div className="body-title">Fixed</div>
                    </label>
                </div>

                <div className="item">
                    <input
                        className="menu-scrollable"
                        type="radio"
                        name="menu-position"
                        id="menu-position2"
                        checked={value === 'scrollable'}
                        onChange={() => onChange('scrollable')}
                    />
                    <label htmlFor="menu-position2">
                        <div className="body-title">Scrollable</div>
                    </label>
                </div>
            </div>
        </fieldset>
    )
}

export default MenuPosition