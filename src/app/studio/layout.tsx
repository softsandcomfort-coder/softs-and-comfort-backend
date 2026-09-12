/**
 * The Studio renders its own full-page chrome, so it deliberately bypasses the
 * dashboard's shell (sidebar, header, global stylesheets) instead of nesting
 * inside it.
 */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
    return children
}
