import Layout from "@/components/layout/Layout";
import Link from "next/link";

export const metadata = {
    title: "No access — Soft & Comfort Admin",
};

/** Where the page guards send a staff account that lacks the permission. */
export default function NoAccessPage() {
    return (
        <Layout>
            <div className="wg-box" style={{ textAlign: "center", padding: "60px 24px" }}>
                <h4 className="mb-10">You don&apos;t have access to this page</h4>
                <div className="body-text mb-20">
                    Ask the store owner if you need it added to your account.
                </div>
                <Link className="tf-button" href="/">
                    Back to dashboard
                </Link>
            </div>
        </Layout>
    );
}
