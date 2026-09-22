'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Footer1 from './Footer1'
import Header1 from './Header1'
import Offcanvas from './Offcanvas'
import Sidebar from './Sidebar'
import PrimaryThemeController from '../ThemeSettings/PrimaryThemeController'
import type { PrimaryThemeColor } from '../ThemeSettings/PrimaryTheme'

export type LayoutProps = {
    children: ReactNode
    headerStyle?: string
    boxed?: boolean
    menuIconHover?: boolean
    menuIconDefault?: boolean
}

export default function Layout({
    headerStyle: _headerStyle,
    children,
    boxed,
    menuIconHover,
    menuIconDefault,
}: LayoutProps) {
    const [hydrated, setHydrated] = useState(false)

    const [isSidebar, setSidebar] = useState(false)
    const handleSidebar = () => setSidebar((prev) => !prev)

    const [isOffcanvas, setIsOffcanvas] = useState(false)
    const handleOffcanvas = () => setIsOffcanvas((prev) => !prev)

    const [menuStyle, setMenuStyle] = useState<'menu-click' | 'icon-hover' | 'icon-default'>(
        menuIconHover ? 'icon-hover' : menuIconDefault ? 'icon-default' : 'menu-click'
    )

    const [menuPosition, setMenuPosition] = useState<'fixed' | 'scrollable'>('fixed')
    const [headerPosition, setHeaderPosition] = useState<'fixed' | 'scrollable'>('fixed')
    const [layoutWidth, setLayoutWidth] = useState<'full' | 'boxed'>(
        boxed ? 'boxed' : 'full'
    )

    const [primaryTheme, setPrimaryTheme] = useState<PrimaryThemeColor>('CC0D39')

    useEffect(() => {
        const savedMenuStyle = localStorage.getItem('menuStyle')
        const savedMenuPosition = localStorage.getItem('menuPosition')
        const savedHeaderPosition = localStorage.getItem('headerPosition')
        const savedLayoutWidth = localStorage.getItem('layoutWidth')
        const stored = localStorage.getItem('primaryTheme') as PrimaryThemeColor | null
        // the template's orange was the old default; move those browsers to the brand colour
        const savedPrimaryTheme = stored === 'FF7433' ? 'CC0D39' : stored

        if (
            savedMenuStyle === 'menu-click' ||
            savedMenuStyle === 'icon-hover' ||
            savedMenuStyle === 'icon-default'
        ) {
            setMenuStyle(savedMenuStyle)
        }

        if (savedMenuPosition === 'fixed' || savedMenuPosition === 'scrollable') {
            setMenuPosition(savedMenuPosition)
        }

        if (savedHeaderPosition === 'fixed' || savedHeaderPosition === 'scrollable') {
            setHeaderPosition(savedHeaderPosition)
        }

        if (savedLayoutWidth === 'full' || savedLayoutWidth === 'boxed') {
            setLayoutWidth(savedLayoutWidth)
        }

        if (
            savedPrimaryTheme === 'CC0D39' ||
            savedPrimaryTheme === '2377FC' ||
            savedPrimaryTheme === '35988D' ||
            savedPrimaryTheme === '7047D6' ||
            savedPrimaryTheme === '189D72'
        ) {
            setPrimaryTheme(savedPrimaryTheme)
        }

        setHydrated(true)
    }, [])

    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem('menuStyle', menuStyle)
    }, [menuStyle, hydrated])

    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem('menuPosition', menuPosition)
    }, [menuPosition, hydrated])

    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem('headerPosition', headerPosition)
    }, [headerPosition, hydrated])

    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem('layoutWidth', layoutWidth)
    }, [layoutWidth, hydrated])

    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem('primaryTheme', primaryTheme)
    }, [primaryTheme, hydrated])

    const handleClearThemeStyle = () => {
        setLayoutWidth('full')
        setMenuStyle('menu-click')
        setMenuPosition('fixed')
        setHeaderPosition('fixed')
        setPrimaryTheme('FF7433')

        localStorage.setItem('layoutWidth', 'full')
        localStorage.setItem('menuStyle', 'menu-click')
        localStorage.setItem('menuPosition', 'fixed')
        localStorage.setItem('headerPosition', 'fixed')
        localStorage.setItem('primaryTheme', 'FF7433')
    }

    const handleClearThemeColors = () => {
        setPrimaryTheme('FF7433')
        localStorage.setItem('primaryTheme', 'FF7433')
    }

    return (
        <>
            <PrimaryThemeController primaryTheme={primaryTheme} />

            <div id="wrapper">
                <div id="page">
                    <div
                        className={`layout-wrap 
                            ${layoutWidth === 'boxed' ? 'layout-width-boxed' : ''}
                            ${menuStyle === 'icon-hover' ? 'menu-style-icon' : ''}
                            ${menuStyle === 'icon-default' ? 'menu-style-icon-default' : ''}
                            ${menuPosition === 'scrollable' ? 'menu-position-scrollable' : ''}
                            ${headerPosition === 'scrollable' ? 'header-position-scrollable' : ''}
                            ${isSidebar ? 'full-width' : ''}
                        `}
                    >
                        <Sidebar handleSidebar={handleSidebar} />

                        <div className="section-content-right">
                            <Header1
                                isSidebar={isSidebar}
                                handleSidebar={handleSidebar}
                                handleOffcanvas={handleOffcanvas}
                            />

                            <div className="main-content">
                                <div className="main-content-inner">
                                    <div className="main-content-wrap">
                                        {children}
                                    </div>
                                </div>
                                <Footer1 />
                            </div>
                        </div>

                        <Offcanvas
                            isOffcanvas={isOffcanvas}
                            handleOffcanvas={handleOffcanvas}
                            layoutWidth={layoutWidth}
                            setLayoutWidth={setLayoutWidth}
                            menuStyle={menuStyle}
                            setMenuStyle={setMenuStyle}
                            menuPosition={menuPosition}
                            setMenuPosition={setMenuPosition}
                            headerPosition={headerPosition}
                            setHeaderPosition={setHeaderPosition}
                            onClearThemeStyle={handleClearThemeStyle}
                            primaryTheme={primaryTheme}
                            setPrimaryTheme={setPrimaryTheme}
                            onClearThemeColors={handleClearThemeColors}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}