"use client";

import { useState } from "react";
import { ReactNode } from "react";
import { AIAssistant } from "@/components/assistant/AIAssistant";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-surface md:h-screen">
      <Topbar onMenuClick={() => setSidebarOpen((v) => !v)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {sidebarOpen && (
          <div className="fixed inset-0 z-[15] bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-surface">{children}</main>
      </div>
      <AIAssistant />
    </div>
  );
}
