import { redirect } from "next/navigation";

/**
 * Public self-registration is gone.
 *
 * This page used to POST to /api/register, which wrote straight into the users
 * table with no authentication — anyone who could reach the dashboard could
 * create themselves an admin account. Accounts are now created by an existing
 * owner under Users, or by `npm run create:admin` for the very first one.
 */
export default function RegisterPage() {
    redirect("/login");
}
