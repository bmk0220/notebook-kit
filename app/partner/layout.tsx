import { Metadata } from 'next';
import { Sidebar } from '@/components/admin/Sidebar';
import { Providers } from '@/components/Providers';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Partner Portal | Notebook Kit',
  description: 'Marketing Partner Dashboard',
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <Providers>{children}</Providers>
      </main>
    </div>
  );
}
