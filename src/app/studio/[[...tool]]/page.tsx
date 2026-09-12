/**
 * Sanity Studio mounted inside the dashboard.
 *
 * Note there are two layers of access control here, and both are wanted:
 *  · the dashboard's own middleware (an admin session cookie is required to
 *    reach /studio at all), and
 *  · Sanity's own login, which decides what the Studio may read or write.
 */
import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

export const dynamic = 'force-static'

export { metadata, viewport } from 'next-sanity/studio'

export default function StudioPage() {
    return <NextStudio config={config} />
}
