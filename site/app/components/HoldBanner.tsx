import { getSessionFromCookies } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { getSettings } from '@/app/lib/settings';

export default async function HoldBanner() {
  const session = await getSessionFromCookies();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { email: session.email } });
  if (!user?.isOnHold) return null;
  const settings = await getSettings();
  return (
    <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
      {settings.holdBannerText || 'Your account is on hold. Please contact support to get it unhold.'}
    </div>
  );
}