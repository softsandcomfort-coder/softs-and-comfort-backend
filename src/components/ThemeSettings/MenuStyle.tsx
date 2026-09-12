'use client'
import React from 'react'

type MenuStyleProps = {
    value: 'menu-click' | 'icon-hover' | 'icon-default'
    onChange: (value: 'menu-click' | 'icon-hover' | 'icon-default') => void
}

const MenuStyle = ({ value, onChange }: MenuStyleProps) => {
    return (
        <fieldset className="menu-style">
            <div className="body-title mb-5">Vertical & Horizontal menu style</div>
            <div className="radio-buttons">
                <div className="item">
                    <input
                        className="menu-click"
                        type="radio"
                        name="menu-style"
                        id="menu-style1"
                        checked={value === 'menu-click'}
                        onChange={() => onChange('menu-click')}
                    />
                    <label htmlFor="menu-style1">
                        <div className="body-title">Menu click</div>
                    </label>
                </div>

                <div className="item">
                    <input
                        className="icon-hover"
                        type="radio"
                        name="menu-style"
                        id="menu-style2"
                        checked={value === 'icon-hover'}
                        onChange={() => onChange('icon-hover')}
                    />
                    <label htmlFor="menu-style2">
                        <div className="body-title">Icon hover</div>
                    </label>
                </div>

                <div className="item">
                    <input
                        className="icon-default"
                        type="radio"
                        name="menu-style"
                        id="menu-style3"
                        checked={value === 'icon-default'}
                        onChange={() => onChange('icon-default')}
                    />
                    <label htmlFor="menu-style3">
                        <div className="body-title">Icon default</div>
                    </label>
                </div>
            </div>
        </fieldset>
    )
}

export default MenuStyle