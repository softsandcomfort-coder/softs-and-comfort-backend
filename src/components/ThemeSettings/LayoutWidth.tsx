'use client'

type LayoutWidthProps = {
    value: 'full' | 'boxed'
    onChange: (value: 'full' | 'boxed') => void
}

const LayoutWidth = ({ value, onChange }: LayoutWidthProps) => {
    return (
        <fieldset className="layout-width">
            <div className="body-title mb-5">Layout width style</div>
            <div className="radio-buttons">
                <div className="item">
                    <input
                        className="full"
                        type="radio"
                        name="width-style"
                        id="width-style1"
                        checked={value === 'full'}
                        onChange={() => onChange('full')}
                    />
                    <label htmlFor="width-style1">
                        <div className="body-title">Full width</div>
                    </label>
                </div>
                <div className="item">
                    <input
                        className="boxed"
                        type="radio"
                        name="width-style"
                        id="width-style2"
                        checked={value === 'boxed'}
                        onChange={() => onChange('boxed')}
                    />
                    <label htmlFor="width-style2">
                        <div className="body-title">Boxed</div>
                    </label>
                </div>
            </div>
        </fieldset>
    )
}

export default LayoutWidth