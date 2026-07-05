/**
 * Bare layout for standalone, printable documents and the public verify page.
 * No app chrome — the root layout still provides fonts, so these render clean and
 * print to PDF without a sidebar, header, or footer bleeding in.
 */
export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
