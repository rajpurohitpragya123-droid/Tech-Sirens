import type { ReactNode } from 'react';
import './style.css';
export const metadata = {
  title: 'खेत Doctor · Operations',
  description: 'Synthetic operations demo. No production privileges.',
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
