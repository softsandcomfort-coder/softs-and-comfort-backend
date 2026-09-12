'use client'

import { useEffect } from 'react'
import type { PrimaryThemeColor } from './PrimaryTheme'

type PrimaryThemeControllerProps = {
    primaryTheme: PrimaryThemeColor
}

export default function PrimaryThemeController({
    primaryTheme,
}: PrimaryThemeControllerProps) {
    useEffect(() => {
        const layoutWrap = document.querySelector('.layout-wrap') as HTMLElement | null

        if (layoutWrap) {
            layoutWrap.setAttribute(
                'data-theme-primary',
                `theme-primary-${primaryTheme}`
            )
        }

        localStorage.setItem('primaryTheme', primaryTheme)
    }, [primaryTheme])

    return null
}