'use client'
import { useState } from 'react'

export default function FullScreenButton() {
    const [isFullscreen, setIsFullscreen] = useState(false)

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            enterFullscreen()
        } else {
            exitFullscreen()
        }
        setIsFullscreen(!isFullscreen)
    }

    const enterFullscreen = () => {
        const elem = document.documentElement as HTMLElement & Record<string, unknown>
        const anyEl = elem as unknown as {
            requestFullscreen?: () => Promise<void>
            msRequestFullscreen?: () => void
            mozRequestFullScreen?: () => void
            webkitRequestFullscreen?: (flags?: number) => void
        }
        if (anyEl.requestFullscreen) {
            void anyEl.requestFullscreen()
        } else if (anyEl.msRequestFullscreen) {
            anyEl.msRequestFullscreen()
        } else if (anyEl.mozRequestFullScreen) {
            anyEl.mozRequestFullScreen()
        } else if (anyEl.webkitRequestFullscreen) {
            anyEl.webkitRequestFullscreen(1)
        }
    }

    const exitFullscreen = () => {
        const doc = document as Document & Record<string, unknown>
        const anyDoc = doc as unknown as {
            exitFullscreen?: () => Promise<void>
            msExitFullscreen?: () => void
            mozCancelFullScreen?: () => void
            webkitExitFullscreen?: () => void
        }
        if (anyDoc.exitFullscreen) {
            void anyDoc.exitFullscreen()
        } else if (anyDoc.msExitFullscreen) {
            anyDoc.msExitFullscreen()
        } else if (anyDoc.mozCancelFullScreen) {
            anyDoc.mozCancelFullScreen()
        } else if (anyDoc.webkitExitFullscreen) {
            anyDoc.webkitExitFullscreen()
        }
    }
    return (
        <>
            <div className="header-item button-zoom-maximize">
                <div onClick={toggleFullscreen}>
                    <i className="icon-maximize" />
                </div>
            </div>
        </>
    )
}
