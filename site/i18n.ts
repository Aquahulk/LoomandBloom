import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'hi', 'mr'];

export default getRequestConfig(async ({ locale }) => {
  if (!locale || !locales.includes(locale)) notFound();
  const l = locale as string;

  return {
    locale: l,
    messages: (await import(`./messages/${l}.json`)).default
  };
});

