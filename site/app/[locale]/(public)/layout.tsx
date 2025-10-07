export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Deduplicate: parent [locale]/layout renders the shared header and footer.
  return <>{children}</>;
}