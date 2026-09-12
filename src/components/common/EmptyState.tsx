import Link from "next/link";

/**
 * Shown when a list has nothing in it, or when the data source could not be
 * reached. Distinguishing "empty" from "broken" matters here: the catalogue
 * starts genuinely empty, and a silent blank table reads as a bug.
 */
export default function EmptyState({
    title,
    message,
    actionHref,
    actionLabel,
}: {
    title: string;
    message: string;
    actionHref?: string;
    actionLabel?: string;
}) {
    return (
        <div className="wg-box">
            <div
                className="flex flex-column items-center justify-center text-center gap10"
                style={{ padding: "56px 20px" }}
            >
                <i className="icon-package" style={{ fontSize: 40, opacity: 0.35 }} />
                <h5 className="mt-10">{title}</h5>
                <div className="body-text" style={{ maxWidth: 460 }}>
                    {message}
                </div>
                {actionHref && actionLabel && (
                    <Link href={actionHref} className="tf-button mt-10">
                        {actionLabel}
                    </Link>
                )}
            </div>
        </div>
    );
}
