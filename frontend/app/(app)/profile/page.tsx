"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { User, Shield, Settings, Camera, Save, Eye, EyeOff, Bell, Moon, Globe } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Input";

type Tab = "profile" | "security" | "preferences";

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "profile", label: "My Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "preferences", label: "Preferences", icon: Settings },
];

function ProfilePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(tabParam ?? "profile");

  useEffect(() => {
    if (tabParam && ["profile", "security", "preferences"].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
    }
  }, [tabParam]);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    router.replace(`/profile?tab=${tab}`);
  }
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [notifToggles, setNotifToggles] = useState({
    screening: true,
    applicants: true,
    export: false,
    system: true,
  });

  // Profile form state
  const [form, setForm] = useState({
    firstName: "Recruiter", lastName: "Pro",
    email: "recruiter@umurava.com", phone: "+1 (555) 000-0000",
    role: "Senior Recruiter", department: "Human Resources",
    location: "Kigali, Rwanda", bio: "Experienced recruiter specializing in tech talent acquisition across Africa and Europe.",
  });

  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark" | "system") ?? "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="w-full px-6 py-5">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Account Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your profile, security, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar nav */}
        <aside className="flex flex-col gap-2">
          {/* Avatar card */}
          <Card className="flex flex-col items-center p-5 text-center">
            <div className="relative">
              <Avatar name="Recruiter Pro" size={72} online />
              <button className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white shadow-card hover:bg-brand-hover">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-3 font-semibold text-ink">{form.firstName} {form.lastName}</p>
            <p className="text-xs text-ink-muted">{form.email}</p>
            <Badge tone="brand" pill className="mt-2">Admin Access</Badge>
          </Card>

          {/* Tab nav */}
          <Card className="overflow-hidden p-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => handleTabChange(id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  activeTab === id ? "bg-brand text-white" : "text-ink hover:bg-surface-soft"
                }`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </Card>
        </aside>

        {/* Main content */}
        <div className="flex flex-col gap-5">

          {/* ── Profile Tab ── */}
          {activeTab === "profile" && (
            <>
              <Card className="p-6">
                <h2 className="mb-5 font-display text-base font-semibold text-ink">Personal Information</h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="First Name">
                    <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                  </Field>
                  <Field label="Last Name">
                    <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                  </Field>
                  <Field label="Email Address">
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </Field>
                  <Field label="Phone Number">
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </Field>
                  <Field label="Job Title / Role">
                    <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                  </Field>
                  <Field label="Department">
                    <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                  </Field>
                  <Field label="Location" className="md:col-span-2">
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </Field>
                  <Field label="Bio" className="md:col-span-2">
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      rows={3}
                      className="w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
                    />
                  </Field>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button leftIcon={<Save className="h-4 w-4" />} onClick={handleSave}>
                  {saved ? "Saved!" : "Save Changes"}
                </Button>
              </div>
            </>
          )}

          {/* ── Security Tab ── */}
          {activeTab === "security" && (
            <>
              <Card className="p-6">
                <h2 className="mb-5 font-display text-base font-semibold text-ink">Change Password</h2>
                <div className="flex flex-col gap-4 max-w-md">
                  <Field label="Current Password">
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="Enter current password" className="pr-10" />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="New Password">
                    <div className="relative">
                      <Input type={showNew ? "text" : "password"} placeholder="Enter new password" className="pr-10" />
                      <button type="button" onClick={() => setShowNew((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirm New Password">
                    <Input type="password" placeholder="Confirm new password" />
                  </Field>
                  <Button className="self-start" onClick={handleSave}>
                    {saved ? "Updated!" : "Update Password"}
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="mb-1 font-display text-base font-semibold text-ink">Two-Factor Authentication</h2>
                <p className="mb-4 text-sm text-ink-muted">Add an extra layer of security to your account.</p>
                <div className="flex items-center justify-between rounded-md border border-line p-4">
                  <div>
                    <p className="text-sm font-medium text-ink">Authenticator App</p>
                    <p className="text-xs text-ink-muted">Use Google Authenticator or similar.</p>
                  </div>
                  <Badge tone="neutral">Not enabled</Badge>
                </div>
                <Button variant="secondary" className="mt-3" size="sm">Enable 2FA</Button>
              </Card>

              <Card className="p-6">
                <h2 className="mb-4 font-display text-base font-semibold text-ink">Active Sessions</h2>
                {[
                  { device: "Chrome on macOS", location: "Kigali, Rwanda", current: true, time: "Now" },
                  { device: "Firefox on Windows", location: "Nairobi, Kenya", current: false, time: "2 days ago" },
                ].map((s) => (
                  <div key={s.device} className="flex items-center justify-between border-b border-line py-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-ink">{s.device}</p>
                      <p className="text-xs text-ink-muted">{s.location} · {s.time}</p>
                    </div>
                    {s.current
                      ? <Badge tone="success" pill>Current</Badge>
                      : <Button variant="danger" size="sm">Revoke</Button>}
                  </div>
                ))}
              </Card>
            </>
          )}

          {/* ── Preferences Tab ── */}
          {activeTab === "preferences" && (
            <>
              <Card className="p-6">
                <h2 className="mb-5 font-display text-base font-semibold text-ink">Notifications</h2>
                <div className="flex flex-col gap-4">
                  {[
                    { key: "screening" as const, icon: Bell, label: "Screening completed", desc: "Get notified when an AI screening run finishes." },
                    { key: "applicants" as const, icon: Bell, label: "New applicants detected", desc: "Alert when new candidates match your open jobs." },
                    { key: "export" as const, icon: Bell, label: "Export ready", desc: "Notify when a file export is available." },
                    { key: "system" as const, icon: Bell, label: "System alerts", desc: "Maintenance and platform updates." },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-ink">{item.label}</p>
                        <p className="text-xs text-ink-muted">{item.desc}</p>
                      </div>
                      <button onClick={() => setNotifToggles((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${notifToggles[item.key] ? "bg-brand" : "bg-line"}`}>
                        <span className={`absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${notifToggles[item.key] ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="mb-5 font-display text-base font-semibold text-ink">Appearance & Region</h2>
                <div className="flex flex-col gap-5 max-w-sm">
                  <Field label="Language">
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                      <select className="h-10 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40">
                        <option>English (US)</option>
                        <option>French</option>
                        <option>Kinyarwanda</option>
                      </select>
                    </div>
                  </Field>
                  <Field label="Theme">
                    <div className="relative">
                      <Moon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
                        className="h-10 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40">
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                  </Field>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button leftIcon={<Save className="h-4 w-4" />} onClick={handleSave}>
                  {saved ? "Saved!" : "Save Preferences"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageInner />
    </Suspense>
  );
}
