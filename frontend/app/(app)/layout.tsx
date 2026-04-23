import { AuthGate } from "@/components/auth/AuthGate";
import { SessionManager } from "@/components/auth/SessionManager";
import { AppShell } from "@/components/layout/AppShell";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <SessionManager />
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
