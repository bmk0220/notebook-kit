import DashboardLayout from '@/components/DashboardLayout';

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout requiredRole="user">
      <div className="p-4 md:p-8">
        {children}
      </div>
    </DashboardLayout>
  );
}
