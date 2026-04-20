"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User,
  Shield,
  Settings,
  Camera,
  Save,
  Eye,
  EyeOff,
  Bell,
  Moon,
  Globe,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  changePassword,
  fetchProfile,
  getStoredAuth,
  updatePreferences,
  updateProfile,
  type AuthUser,
  type LanguagePreference,
  type NotificationPreferences,
  type ThemePreference,
} from "@/lib/auth";

type Tab = "profile" | "security" | "preferences";

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "profile", label: "My Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "preferences", label: "Preferences", icon: Settings },
];

type ProfileFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  location: string;
  bio: string;
};

type SecurityFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type PreferencesFormState = {
  notificationPreferences: NotificationPreferences;
  languagePreference: LanguagePreference;
  themePreference: ThemePreference;
};

function roleLabel(role: AuthUser["role"]) {
  return `${role.charAt(0).toUpperCase()}${role.slice(1)} Access`;
}

function buildProfileForm(user: AuthUser | null): ProfileFormState {
  if (!user) {
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      location: "",
      bio: "",
    };
  }

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phoneNumber ?? "",
    role: roleLabel(user.role),
    department: user.department ?? "",
    location: user.location ?? "",
    bio: user.bio ?? "",
  };
}

function buildPreferencesForm(user: AuthUser | null): PreferencesFormState {
  return {
    notificationPreferences: {
      screening: user?.notificationPreferences?.screening ?? true,
      applicants: user?.notificationPreferences?.applicants ?? true,
      export: user?.notificationPreferences?.export ?? false,
      system: user?.notificationPreferences?.system ?? true,
    },
    languagePreference: user?.languagePreference ?? "en",
    themePreference: user?.themePreference ?? "light",
  };
}

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
  const [profile, setProfile] = useState<AuthUser | null>(() => getStoredAuth()?.user ?? null);
  const [form, setForm] = useState<ProfileFormState>(() => buildProfileForm(getStoredAuth()?.user ?? null));
  const [securityForm, setSecurityForm] = useState<SecurityFormState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [preferencesForm, setPreferencesForm] = useState<PreferencesFormState>(() =>
    buildPreferencesForm(getStoredAuth()?.user ?? null)
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [theme, setTheme] = useState<ThemePreference>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as ThemePreference) ?? "light";
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

  async function loadProfile() {
    setProfileError("");
    setProfileSuccess("");

    try {
      const result = await fetchProfile();
      setProfile(result.user);
      setForm(buildProfileForm(result.user));
      const nextPreferences = buildPreferencesForm(result.user);
      setPreferencesForm(nextPreferences);
      setTheme(nextPreferences.themePreference);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to load your profile.");
    } finally {
      setIsLoadingProfile(false);
      setIsRefreshingProfile(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function handleProfileSave() {
    setProfileError("");
    setProfileSuccess("");
    setIsSavingProfile(true);

    try {
      const result = await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phone.trim() || undefined,
        department: form.department.trim() || undefined,
        location: form.location.trim() || undefined,
        bio: form.bio.trim() || undefined,
        profilePicture: profile?.profilePicture,
      });

      setProfile(result.user);
      setForm(buildProfileForm(result.user));
      setProfileSuccess(result.message);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to update your profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSave() {
    setProfileError("");
    setProfileSuccess("");

    if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
      setProfileError("Fill in all password fields before updating your password.");
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setProfileError("New password confirmation does not match.");
      return;
    }

    setIsSavingPassword(true);

    try {
      const result = await changePassword({
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      setSecurityForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setProfileSuccess(result.message);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to update your password.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handlePreferencesSave() {
    setProfileError("");
    setProfileSuccess("");
    setIsSavingPreferences(true);

    try {
      const result = await updatePreferences(preferencesForm);
      setProfile(result.user);
      const nextPreferences = buildPreferencesForm(result.user);
      setPreferencesForm(nextPreferences);
      setTheme(nextPreferences.themePreference);
      setProfileSuccess(result.message);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to update your preferences.");
    } finally {
      setIsSavingPreferences(false);
    }
  }

  const displayName = useMemo(() => {
    if (profile) {
      return [profile.firstName, profile.lastName].filter(Boolean).join(" ");
    }

    return [form.firstName, form.lastName].filter(Boolean).join(" ") || "Workspace User";
  }, [form.firstName, form.lastName, profile]);

  const roleBadgeTone = profile?.role === "admin" ? "brand" : profile?.role === "recruiter" ? "info" : "neutral";
  const syncLabel = profile?.updatedAt
    ? `Last synced ${new Date(profile.updatedAt).toLocaleString()}`
    : "Waiting for backend profile data";

  return (
    <div className="w-full px-6 py-5">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Account Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your profile, security, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="flex flex-col gap-2">
          <Card className="flex flex-col items-center p-5 text-center">
            <div className="relative">
              {isLoadingProfile ? (
                <Skeleton shape="circle" className="h-[72px] w-[72px]" />
              ) : (
                <Avatar name={displayName} src={profile?.profilePicture} size={72} online />
              )}
              <button className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white shadow-card hover:bg-brand-hover">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            {isLoadingProfile ? (
              <>
                <Skeleton className="mt-3 h-4 w-28" />
                <Skeleton className="mt-2 h-3 w-36" />
              </>
            ) : (
              <>
                <p className="mt-3 font-semibold text-ink">{displayName}</p>
                <p className="text-xs text-ink-muted">{form.email}</p>
              </>
            )}
            <Badge tone={roleBadgeTone} pill className="mt-2">
              {profile ? roleLabel(profile.role) : "Profile loading"}
            </Badge>
            <p className="mt-3 text-[11px] text-ink-muted">{syncLabel}</p>
          </Card>

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

        <div className="flex flex-col gap-5">
          {profileError && (
            <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="rounded-2xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
              {profileSuccess}
            </div>
          )}

          {activeTab === "profile" && (
            <>
              <Card className="p-6">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="font-display text-base font-semibold text-ink">Personal Information</h2>
                    <p className="mt-1 text-sm text-ink-muted">
                      This section is connected to the backend profile endpoint and reflects the signed-in account.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    leftIcon={isRefreshingProfile ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    onClick={() => {
                      setIsRefreshingProfile(true);
                      void loadProfile();
                    }}
                    disabled={isLoadingProfile || isRefreshingProfile}
                  >
                    {isRefreshingProfile ? "Refreshing" : "Refresh"}
                  </Button>
                </div>

                {isLoadingProfile ? (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className={index >= 4 ? "md:col-span-2" : ""}>
                        <Skeleton className="mb-2 h-3 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
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
                    <Field label="Phone Number" hint="Loaded from the backend when available.">
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </Field>
                    <Field label="Account Role">
                      <Input value={form.role} readOnly className="bg-surface-soft" />
                    </Field>
                    <Field label="Email Verification">
                      <Input
                        value={profile?.isEmailVerified ? "Verified" : "Pending verification"}
                        readOnly
                        className="bg-surface-soft"
                      />
                    </Field>
                      <Field label="Department">
                        <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                      </Field>
                    <Field label="Location">
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
                )}
              </Card>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-ink-muted">
                  Profile changes are now saved to the backend for your signed-in account.
                </p>
                <Button
                  leftIcon={isSavingProfile ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  onClick={handleProfileSave}
                  disabled={isLoadingProfile || isRefreshingProfile || isSavingProfile}
                >
                  {isSavingProfile ? "Saving" : saved ? "Saved!" : "Save Changes"}
                </Button>
              </div>
            </>
          )}

          {activeTab === "security" && (
            <>
              <Card className="p-6">
                <h2 className="mb-5 font-display text-base font-semibold text-ink">Change Password</h2>
                <div className="flex flex-col gap-4 max-w-md">
                  <Field label="Current Password">
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        className="pr-10"
                        value={securityForm.currentPassword}
                        onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="New Password">
                    <div className="relative">
                      <Input
                        type={showNew ? "text" : "password"}
                        placeholder="Enter new password"
                        className="pr-10"
                        value={securityForm.newPassword}
                        onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                      />
                      <button type="button" onClick={() => setShowNew((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirm New Password">
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={securityForm.confirmPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                    />
                  </Field>
                  <Button
                    className="self-start"
                    onClick={handlePasswordSave}
                    disabled={isSavingPassword}
                    leftIcon={isSavingPassword ? <LoaderCircle className="h-4 w-4 animate-spin" /> : undefined}
                  >
                    {isSavingPassword ? "Updating" : saved ? "Updated!" : "Update Password"}
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
                <Button variant="secondary" className="mt-3" size="sm" disabled>Enable 2FA</Button>
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
                      : <Button variant="danger" size="sm" disabled>Revoke</Button>}
                  </div>
                ))}
              </Card>
            </>
          )}

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
                      <button
                        onClick={() =>
                          setPreferencesForm((prev) => ({
                            ...prev,
                            notificationPreferences: {
                              ...prev.notificationPreferences,
                              [item.key]: !prev.notificationPreferences[item.key],
                            },
                          }))
                        }
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                          preferencesForm.notificationPreferences[item.key] ? "bg-brand" : "bg-line"
                        }`}
                      >
                        <span
                          className={`absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${
                            preferencesForm.notificationPreferences[item.key] ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
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
                      <select
                        value={preferencesForm.languagePreference}
                        onChange={(e) =>
                          setPreferencesForm((prev) => ({
                            ...prev,
                            languagePreference: e.target.value as LanguagePreference,
                          }))
                        }
                        className="h-10 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
                      >
                        <option value="en">English (US)</option>
                        <option value="fr">French</option>
                        <option value="rw">Kinyarwanda</option>
                      </select>
                    </div>
                  </Field>
                  <Field label="Theme">
                    <div className="relative">
                      <Moon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                      <select
                        value={preferencesForm.themePreference}
                        onChange={(e) => {
                          const value = e.target.value as ThemePreference;
                          setPreferencesForm((prev) => ({
                            ...prev,
                            themePreference: value,
                          }));
                          setTheme(value);
                        }}
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
                <Button
                  leftIcon={isSavingPreferences ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  onClick={handlePreferencesSave}
                  disabled={isSavingPreferences}
                >
                  {isSavingPreferences ? "Saving" : saved ? "Saved!" : "Save Preferences"}
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
