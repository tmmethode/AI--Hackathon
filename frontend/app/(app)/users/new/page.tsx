"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, KeyRound, ShieldAlert, UserPlus2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { getStoredAuth, registerUser, type UserRole } from "@/lib/auth";

const roleOptions: Array<{ value: UserRole; label: string; helper: string }> = [
  { value: "recruiter", label: "Recruiter", helper: "Can review pipelines, candidates, and shortlists." },
  { value: "admin", label: "Admin", helper: "Can manage users and workspace configuration." },
  { value: "applicant", label: "Applicant", helper: "Can sign in as a candidate-facing account." },
];

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  role: "recruiter" as UserRole,
};

export default function AdminRegisterUserPage() {
  const currentUser = useMemo(() => getStoredAuth()?.user ?? null, []);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdEmail, setCreatedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRole = roleOptions.find((option) => option.value === form.role) ?? roleOptions[0];
  const isAdmin = currentUser?.role === "admin";

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerUser({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        phoneNumber: form.phoneNumber.trim() || undefined,
      });

      setCreatedEmail(result.user.email);
      setSuccess(result.message);
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full px-6 py-5">
      <PageHeader
        title="Register New User"
        description="Create recruiter, admin, or applicant accounts from the workspace without leaving the admin panel."
        actions={
          <Badge tone={isAdmin ? "success" : "warning"} pill>
            {isAdmin ? "Admin session detected" : "Admin review recommended"}
          </Badge>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-6 py-5">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <UserPlus2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">Account details</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  New users receive a standard email-and-password account they can use immediately on the login screen.
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="First name">
                <Input
                  value={form.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  placeholder="Aline"
                  required
                />
              </Field>

              <Field label="Last name">
                <Input
                  value={form.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  placeholder="Mukamana"
                  required
                />
              </Field>

              <Field label="Work email" className="md:col-span-2">
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="new.user@company.com"
                  required
                />
              </Field>

              <Field label="Phone number" hint="Optional, but useful for onboarding and support.">
                <Input
                  type="tel"
                  autoComplete="tel"
                  value={form.phoneNumber}
                  onChange={(event) => updateField("phoneNumber", event.target.value)}
                  placeholder="+250 7xx xxx xxx"
                />
              </Field>

              <Field label="Role" hint={selectedRole.helper}>
                <Select value={form.role} onChange={(event) => updateField("role", event.target.value as UserRole)}>
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Temporary password"
                hint="Use a strong starter password, then ask the user to change it after first sign-in."
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />
              </Field>

              <Field label="Confirm password">
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => updateField("confirmPassword", event.target.value)}
                  placeholder="Repeat password"
                  required
                />
              </Field>
            </div>

            {error && (
              <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            {!isAdmin && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Only admins can create new users. Sign in with an admin account to submit this form.
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
                {success} {createdEmail ? `The account for ${createdEmail} is ready to use.` : ""}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <Button
                type="submit"
                size="lg"
                leftIcon={<UserPlus2 className="h-4 w-4" />}
                disabled={isSubmitting || !isAdmin}
              >
                {isSubmitting ? "Creating user..." : "Create user"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                disabled={isSubmitting}
                onClick={() => {
                  setForm(initialForm);
                  setError("");
                  setSuccess("");
                  setCreatedEmail("");
                }}
              >
                Reset form
              </Button>
            </div>
          </form>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Admin checklist</h3>
                <p className="text-sm text-ink-muted">A quick quality gate before you create the account.</p>
              </div>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-ink-muted">
              <li className="rounded-2xl border border-line bg-surface-soft/50 px-4 py-3">Use the employee's real work email so login recovery stays simple.</li>
              <li className="rounded-2xl border border-line bg-surface-soft/50 px-4 py-3">Assign the smallest role that still lets them do their job.</li>
              <li className="rounded-2xl border border-line bg-surface-soft/50 px-4 py-3">Share the temporary password through a secure internal channel.</li>
            </ul>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <ShieldAlert className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Access note</h3>
                <p className="text-sm text-ink-muted">The current backend endpoint creates accounts directly.</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              This page is intended for admins. If you want stricter enforcement, the next step is to protect the backend
              registration endpoint so only authenticated admins can create users.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <KeyRound className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Current session</h3>
                <p className="text-sm text-ink-muted">The creator account shown below is not modified by registration.</p>
              </div>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Signed-in user</dt>
                <dd className="font-medium text-ink">
                  {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "No local session found"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Role</dt>
                <dd><Badge tone={isAdmin ? "success" : "neutral"}>{currentUser?.role ?? "Unknown"}</Badge></dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Default new role</dt>
                <dd className="font-medium text-ink">Recruiter</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
