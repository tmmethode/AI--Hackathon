"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Save, Undo2, Bell, Shield, Plug, Globe, Moon, Sun,
  Key, Users, Database, Webhook, Check, ChevronRight,
  Mail, Smartphone, Lock, Eye, EyeOff, Info,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";

const tabs = [
  { id: "general", label: "General", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Plug },
] as const;

type TabId = typeof tabs[number]["id"];

interface Integration {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
  tag?: string;
}

const integrations: Integration[] = [
  { name: "Umurava Talent Pool", description: "Connect to browse and import candidates directly.", icon: Users, connected: true, tag: "Active" },
  { name: "Google Workspace", description: "Sync calendars for interview scheduling.", icon: Mail, connected: true, tag: "Synced" },
  { name: "Slack Notifications", description: "Get screening alerts in your Slack workspace.", icon: Webhook, connected: false },
  { name: "ATS Integration", description: "Sync candidates with your Applicant Tracking System.", icon: Database, connected: false },
  { name: "LinkedIn Recruiter", description: "Import candidate profiles from LinkedIn.", icon: Globe, connected: false },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="w-full px-6 py-5">
      <PageHeader
        title="Settings"
        description="Configure your account, notifications, security, and integrations."
        actions={
          <>
            <Button variant="secondary" leftIcon={<Undo2 className="h-4 w-4" />} onClick={() => window.location.reload()}>
              Reset
            </Button>
            <Button leftIcon={saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />} onClick={handleSave}>
              {saved ? "Saved!" : "Save Changes"}
            </Button>
          </>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Tab navigation */}
        <nav className="flex flex-row gap-1 lg:flex-col" aria-label="Settings sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-brand-soft text-brand"
                    : "text-ink-muted hover:bg-surface-soft hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        <div className="flex flex-col gap-6">
          {activeTab === "general" && (
            <>
              <Card className="p-6">
                <h2 className="font-display text-lg font-semibold text-ink">Organization Profile</h2>
                <p className="mt-1 text-sm text-ink-muted">Basic details about your hiring organization.</p>
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Organization Name" className="md:col-span-2">
                    <Input defaultValue="Umurava Technologies" />
                  </Field>
                  <Field label="Industry">
                    <Select defaultValue="tech">
                      <option value="tech">Technology</option>
                      <option value="finance">Finance</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="education">Education</option>
                    </Select>
                  </Field>
                  <Field label="Company Size">
                    <Select defaultValue="mid">
                      <option value="startup">1-50 employees</option>
                      <option value="mid">51-200 employees</option>
                      <option value="large">201-1000 employees</option>
                      <option value="enterprise">1000+ employees</option>
                    </Select>
                  </Field>
                  <Field label="Primary Location">
                    <Input defaultValue="Kigali, Rwanda" />
                  </Field>
                  <Field label="Website">
                    <Input defaultValue="https://umurava.africa" />
                  </Field>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="font-display text-lg font-semibold text-ink">Display Preferences</h2>
                <p className="mt-1 text-sm text-ink-muted">Customize the look and feel of your workspace.</p>
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Theme">
                    <div className="flex gap-3">
                      <button className="flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-brand bg-white p-3 text-sm font-medium text-ink">
                        <Sun className="h-4 w-4" /> Light
                      </button>
                      <button className="flex flex-1 items-center justify-center gap-2 rounded-md border border-line bg-ink p-3 text-sm font-medium text-white">
                        <Moon className="h-4 w-4" /> Dark
                      </button>
                    </div>
                  </Field>
                  <Field label="Language">
                    <Select defaultValue="en">
                      <option value="en">English (US)</option>
                      <option value="fr">Français</option>
                      <option value="rw">Kinyarwanda</option>
                    </Select>
                  </Field>
                  <Field label="Date Format">
                    <Select defaultValue="iso">
                      <option value="iso">YYYY-MM-DD</option>
                      <option value="us">MM/DD/YYYY</option>
                      <option value="eu">DD/MM/YYYY</option>
                    </Select>
                  </Field>
                  <Field label="Timezone">
                    <Select defaultValue="cat">
                      <option value="cat">Africa/Kigali (CAT)</option>
                      <option value="utc">UTC</option>
                      <option value="est">America/New_York (EST)</option>
                    </Select>
                  </Field>
                </div>
              </Card>
            </>
          )}

          {activeTab === "notifications" && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold text-ink">Notification Preferences</h2>
              <p className="mt-1 text-sm text-ink-muted">Control which alerts you receive and how they are delivered.</p>

              <div className="mt-6 divide-y divide-line">
                {[
                  { label: "Screening Run Completed", desc: "Get notified when an AI screening finishes processing.", email: true, push: true },
                  { label: "New Applicants Ingested", desc: "Alert when new candidates are added to a job pool.", email: true, push: false },
                  { label: "Interview Scheduled", desc: "Confirmation when an interview is booked.", email: true, push: true },
                  { label: "Weekly Summary Report", desc: "Digest of hiring pipeline activity each Monday.", email: true, push: false },
                  { label: "System Maintenance", desc: "Planned downtime and infrastructure updates.", email: false, push: false },
                ].map((n) => (
                  <div key={n.label} className="flex flex-col gap-3 py-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">{n.label}</p>
                      <p className="text-xs text-ink-muted">{n.desc}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-ink">
                        <input type="checkbox" defaultChecked={n.email} className="h-4 w-4 rounded border-line text-brand focus:ring-brand/40" />
                        <Mail className="h-3.5 w-3.5 text-ink-muted" /> Email
                      </label>
                      <label className="flex items-center gap-2 text-xs text-ink">
                        <input type="checkbox" defaultChecked={n.push} className="h-4 w-4 rounded border-line text-brand focus:ring-brand/40" />
                        <Smartphone className="h-3.5 w-3.5 text-ink-muted" /> Push
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "security" && (
            <>
              <Card className="p-6">
                <h2 className="font-display text-lg font-semibold text-ink">Authentication & Security</h2>
                <p className="mt-1 text-sm text-ink-muted">Manage passwords, API keys, and access controls.</p>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Current Password">
                    <Input type="password" placeholder="••••••••" />
                  </Field>
                  <Field label="New Password">
                    <Input type="password" placeholder="Choose a strong password" />
                  </Field>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-md border border-line p-4">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-brand" />
                    <div>
                      <p className="text-sm font-medium text-ink">Two-Factor Authentication</p>
                      <p className="text-xs text-ink-muted">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <Badge tone="success" pill>Enabled</Badge>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">API Key</h3>
                    <p className="text-xs text-ink-muted">Use this key for programmatic access to the Umurava API.</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowApiKey((v) => !v)}
                    leftIcon={showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}>
                    {showApiKey ? "Hide" : "Reveal"}
                  </Button>
                </div>
                <div className="mt-3 rounded-md border border-line bg-surface-soft/60 px-4 py-3 font-mono text-xs text-ink select-all">
                  {showApiKey ? "sk-umv-4f8a9c2e1b7d3f6a0e5c8b2d7f1a4e9c3b6d8a" : "sk-umv-••••••••••••••••••••••••••••••••"}
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-ink-muted">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Never share your API key. Rotate it immediately if compromised.
                </div>
              </Card>
            </>
          )}

          {activeTab === "integrations" && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold text-ink">Connected Services</h2>
              <p className="mt-1 text-sm text-ink-muted">Manage third-party integrations with your screening pipeline.</p>

              <ul className="mt-5 divide-y divide-line">
                {integrations.map((intg) => {
                  const Icon = intg.icon;
                  return (
                    <li key={intg.name} className="flex items-center gap-4 py-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand/10">
                        <Icon className="h-5 w-5 text-brand" />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink">{intg.name}</p>
                          {intg.connected && intg.tag && <Badge tone="success" pill>{intg.tag}</Badge>}
                        </div>
                        <p className="text-xs text-ink-muted">{intg.description}</p>
                      </div>
                      <Button
                        variant={intg.connected ? "secondary" : "primary"}
                        size="sm"
                        leftIcon={intg.connected ? <Check className="h-3.5 w-3.5" /> : <Plug className="h-3.5 w-3.5" />}
                      >
                        {intg.connected ? "Manage" : "Connect"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
