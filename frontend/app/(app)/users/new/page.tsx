"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  MailCheck,
  PencilLine,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus2,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserManagementListSkeleton } from "@/components/page-skeletons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import {
  fetchProfile,
  getStoredAuth,
  listUsers,
  registerUser,
  resetManagedUserPassword,
  updateManagedUser,
  type AdminUpdateUserPayload,
  type AuthUser,
  type UserRole,
} from "@/lib/auth";

const roleOptions: Array<{ value: UserRole; label: string; helper: string }> = [
  { value: "recruiter", label: "Recruiter", helper: "Can review pipelines, candidates, and shortlists." },
  { value: "admin", label: "Admin", helper: "Can manage users and workspace configuration." },
  { value: "applicant", label: "Applicant", helper: "Can sign in as a candidate-facing account." },
];

const initialRegistrationForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  role: "recruiter" as UserRole,
};

const initialEditForm: AdminUpdateUserPayload = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  role: "recruiter",
  department: "",
  location: "",
  bio: "",
  isEmailVerified: false,
};

const initialResetForm = {
  newPassword: "",
  confirmPassword: "",
};

function formatUserDate(value?: string) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getRoleTone(role: UserRole) {
  if (role === "admin") return "brand" as const;
  if (role === "recruiter") return "info" as const;
  return "neutral" as const;
}

export default function AdminRegisterUserPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredAuth()?.user ?? null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [form, setForm] = useState(initialRegistrationForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdEmail, setCreatedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [usersError, setUsersError] = useState("");
  const [usersSuccess, setUsersSuccess] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [hasLoadedUsers, setHasLoadedUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [editForm, setEditForm] = useState<AdminUpdateUserPayload>(initialEditForm);
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [passwordTarget, setPasswordTarget] = useState<AuthUser | null>(null);
  const [resetForm, setResetForm] = useState(initialResetForm);
  const [resetError, setResetError] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const selectedRole = roleOptions.find((option) => option.value === form.role) ?? roleOptions[0];
  const isAdmin = currentUser?.role === "admin";
  const isUserDirectoryReady = isAdmin && hasLoadedUsers;

  async function loadWorkspaceUsers() {
    if (!isAdmin) {
      setUsers([]);
      setUsersError("");
      setHasLoadedUsers(false);
      return;
    }

    setIsLoadingUsers(true);
    setUsersError("");

    try {
      const result = await listUsers();
      setUsers(result.users);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : "Failed to load workspace users.");
    } finally {
      setHasLoadedUsers(true);
      setIsLoadingUsers(false);
    }
  }

  useEffect(() => {
    const session = getStoredAuth();

    if (!session?.token) {
      setCurrentUser(null);
      setIsLoadingSession(false);
      return;
    }

    let isMounted = true;

    void fetchProfile()
      .then((result) => {
        if (isMounted) {
          setCurrentUser(result.user);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCurrentUser(session.user);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void loadWorkspaceUsers();
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [user.firstName, user.lastName, user.email, user.role, user.department, user.location]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  }, [searchQuery, users]);

  const adminCount = users.filter((user) => user.role === "admin").length;
  const verifiedCount = users.filter((user) => user.isEmailVerified).length;
  const managementHighlights = [
    {
      label: "Workspace users",
      value: isUserDirectoryReady ? String(users.length) : isAdmin ? "..." : "Locked",
      tone: isUserDirectoryReady ? ("brand" as const) : isAdmin ? ("neutral" as const) : ("warning" as const),
      helper: isUserDirectoryReady
        ? "Live total from the backend user directory."
        : isAdmin
          ? "Loading the current workspace directory from the backend."
          : "Sign in as an admin to load the live workspace directory.",
    },
    {
      label: "Admin accounts",
      value: isUserDirectoryReady ? String(adminCount) : isAdmin ? "..." : "Locked",
      tone: !isUserDirectoryReady ? (isAdmin ? ("neutral" as const) : ("warning" as const)) : adminCount > 0 ? ("success" as const) : ("warning" as const),
      helper: isUserDirectoryReady
        ? "At least one admin should remain available for workspace operations."
        : isAdmin
          ? "Admin coverage will appear once the backend user list finishes loading."
          : "Admin-only metric.",
    },
    {
      label: "Verified emails",
      value: isUserDirectoryReady ? `${verifiedCount}/${users.length || 0}` : isAdmin ? "..." : "Locked",
      tone: !isUserDirectoryReady ? (isAdmin ? ("neutral" as const) : ("warning" as const)) : verifiedCount > 0 ? ("info" as const) : ("neutral" as const),
      helper: isUserDirectoryReady
        ? "Verification state is editable from the user editor."
        : isAdmin
          ? "Verification coverage will populate from backend user records."
          : "Sign in as admin to review verification status.",
    },
  ];

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateEditField<K extends keyof AdminUpdateUserPayload>(key: K, value: AdminUpdateUserPayload[K]) {
    setEditForm((current) => ({ ...current, [key]: value }));
  }

  function openEditModal(user: AuthUser) {
    setEditError("");
    setEditingUser(user);
    setEditForm({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber ?? "",
      role: user.role,
      department: user.department ?? "",
      location: user.location ?? "",
      bio: user.bio ?? "",
      profilePicture: user.profilePicture ?? "",
      isEmailVerified: user.isEmailVerified,
    });
  }

  function openResetPasswordModal(user: AuthUser) {
    setResetError("");
    setPasswordTarget(user);
    setResetForm(initialResetForm);
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
      setUsersSuccess(`Added ${result.user.firstName} ${result.user.lastName} to the workspace.`);
      setForm(initialRegistrationForm);
      await loadWorkspaceUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    setEditError("");

    if (!editForm.email?.trim() || !editForm.firstName?.trim() || !editForm.lastName?.trim()) {
      setEditError("First name, last name, and email are required.");
      return;
    }

    setIsSavingEdit(true);

    try {
      const result = await updateManagedUser(editingUser._id, {
        ...editForm,
        email: editForm.email.trim(),
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phoneNumber: editForm.phoneNumber?.trim() || "",
        department: editForm.department?.trim() || "",
        location: editForm.location?.trim() || "",
        bio: editForm.bio?.trim() || "",
        profilePicture: editForm.profilePicture?.trim() || "",
      });

      if (currentUser?._id === result.user._id) {
        setCurrentUser(result.user);
      }

      setUsers((current) => current.map((user) => (user._id === result.user._id ? result.user : user)));
      setUsersSuccess(`Updated ${result.user.firstName} ${result.user.lastName}.`);
      setEditingUser(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update this user.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordTarget) {
      return;
    }

    setResetError("");

    if (resetForm.newPassword.length < 8) {
      setResetError("Password must be at least 8 characters long.");
      return;
    }

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetError("Password confirmation does not match.");
      return;
    }

    setIsResettingPassword(true);

    try {
      const result = await resetManagedUserPassword(passwordTarget._id, resetForm.newPassword);
      setUsersSuccess(`${result.message} ${passwordTarget.firstName} ${passwordTarget.lastName} can sign in with the new password.`);
      setPasswordTarget(null);
      setResetForm(initialResetForm);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to reset this password.");
    } finally {
      setIsResettingPassword(false);
    }
  }

  return (
    <div className="w-full px-6 py-5">
      <PageHeader
        title="User Management"
        description="Register new users, review the live workspace directory, edit account details, and reset passwords from one admin workspace."
        actions={
          <Badge tone={isAdmin ? "success" : "warning"} pill>
            {isAdmin ? "Admin session detected" : "Admin access required"}
          </Badge>
        }
      />

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {managementHighlights.map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{item.label}</p>
            <div className="mt-2 flex items-center gap-3">
              <p className="font-display text-2xl font-bold text-ink">{item.value}</p>
              <Badge tone={item.tone} pill>
                {isUserDirectoryReady ? "Backend" : isAdmin ? "Loading" : "Locked"}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{item.helper}</p>
          </Card>
        ))}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden">
            <div className="border-b border-line px-6 py-5">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <UserPlus2 className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl font-semibold text-ink">Register user</h2>
                    <Badge tone="brand" pill>
                      Section 1
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    Create a new recruiter, admin, or applicant account with an initial password and handoff notes.
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
                    placeholder="First name"
                    required
                  />
                </Field>

                <Field label="Last name">
                  <Input
                    value={form.lastName}
                    onChange={(event) => updateField("lastName", event.target.value)}
                    placeholder="Last name"
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
                    placeholder="Phone number"
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
                    setForm(initialRegistrationForm);
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

          <Card className="overflow-hidden">
            <div className="border-b border-line px-6 py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Users className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-xl font-semibold text-ink">Existing users</h2>
                      <Badge tone="info" pill>
                        Section 2
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      Review the workspace directory, update roles and contact details, and reset passwords when needed.
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  onClick={() => {
                    setUsersSuccess("");
                    void loadWorkspaceUsers();
                  }}
                  disabled={isLoadingUsers || !isAdmin}
                >
                  {isLoadingUsers ? "Refreshing..." : "Refresh users"}
                </Button>
              </div>
            </div>

            <div className="border-b border-line px-6 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by name, email, role, department, or location"
                    className="pl-9"
                    disabled={!isAdmin || (isLoadingUsers && !hasLoadedUsers)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isUserDirectoryReady ? (
                    <>
                      <Badge tone="neutral" pill>
                        {filteredUsers.length} shown
                      </Badge>
                      <Badge tone="brand" pill>
                        {users.length} total
                      </Badge>
                    </>
                  ) : (
                    <Badge tone={isAdmin ? "neutral" : "warning"} pill>
                      {isAdmin ? "Loading directory" : "Admin access required"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {usersSuccess && (
              <div className="border-b border-line bg-success/5 px-6 py-3 text-sm text-success">{usersSuccess}</div>
            )}

            {usersError && (
              <div className="border-b border-line bg-danger/5 px-6 py-3 text-sm text-danger">{usersError}</div>
            )}

            {!isAdmin ? (
              <div className="px-6 py-10 text-sm text-ink-muted">
                Sign in with an admin account to load the workspace user directory.
              </div>
            ) : isLoadingUsers && users.length === 0 ? (
              <UserManagementListSkeleton />
            ) : filteredUsers.length === 0 ? (
              <div className="px-6 py-10 text-sm text-ink-muted">
                {users.length === 0
                  ? "No users have been created yet. Register the first user to populate the directory."
                  : "No users matched your current search."}
              </div>
            ) : (
              <div className="divide-y divide-line">
                {filteredUsers.map((user) => (
                  <div key={user._id} className="px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-lg font-semibold text-ink">
                            {user.firstName} {user.lastName}
                          </h3>
                          <Badge tone={getRoleTone(user.role)} pill>
                            {user.role}
                          </Badge>
                          <Badge tone={user.isEmailVerified ? "success" : "warning"} pill>
                            {user.isEmailVerified ? "Verified" : "Unverified"}
                          </Badge>
                          {currentUser?._id === user._id && (
                            <Badge tone="info" pill>
                              Current session
                            </Badge>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
                          <span>{user.email}</span>
                          <span>{user.phoneNumber || "No phone number"}</span>
                          <span>{user.department || "No department"}</span>
                          <span>{user.location || "No location"}</span>
                        </div>

                        {user.bio && <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-muted">{user.bio}</p>}

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                          <span className="rounded-full bg-surface-soft px-3 py-1">Created {formatUserDate(user.createdAt)}</span>
                          <span className="rounded-full bg-surface-soft px-3 py-1">
                            {user.profilePicture ? "Profile picture set" : "No profile picture"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          leftIcon={<PencilLine className="h-4 w-4" />}
                          onClick={() => openEditModal(user)}
                          disabled={!isAdmin}
                        >
                          Edit user
                        </Button>
                        <Button
                          variant="ghost"
                          leftIcon={<KeyRound className="h-4 w-4" />}
                          onClick={() => openResetPasswordModal(user)}
                          disabled={!isAdmin}
                        >
                          Reset password
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Role management</h3>
                <p className="text-sm text-ink-muted">Use the smallest role that still lets the person do their job.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {roleOptions.map((option) => (
                <div
                  key={option.value}
                  className={`rounded-2xl border px-4 py-3 ${
                    option.value === selectedRole.value
                      ? "border-brand/30 bg-brand-soft/30"
                      : "border-line bg-surface-soft/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{option.label}</p>
                    <Badge tone={getRoleTone(option.value)}>{option.value}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{option.helper}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <MailCheck className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Admin controls</h3>
                <p className="text-sm text-ink-muted">Registration, edits, and password resets are enforced by the backend.</p>
              </div>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-ink-muted">
              <li className="rounded-2xl border border-line bg-surface-soft/50 px-4 py-3">
                Only authenticated admins can create users, list the directory, edit roles, or reset passwords.
              </li>
              <li className="rounded-2xl border border-line bg-surface-soft/50 px-4 py-3">
                The backend prevents removing the final remaining admin account from the workspace.
              </li>
              <li className="rounded-2xl border border-line bg-surface-soft/50 px-4 py-3">
                When you edit your own account here, the local session updates to stay in sync with the backend.
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Onboarding checklist</h3>
                <p className="text-sm text-ink-muted">A quick quality gate for account creation and handoff.</p>
              </div>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-ink-muted">
              <li className="rounded-2xl border border-line bg-surface-soft/50 px-4 py-3">
                Use the employee&apos;s real work email so login recovery stays simple.
              </li>
              <li className="rounded-2xl border border-line bg-surface-soft/50 px-4 py-3">
                Share temporary or reset passwords through a secure internal channel.
              </li>
              <li className="rounded-2xl border border-line bg-surface-soft/50 px-4 py-3">
                Ask the user to update their password after their first successful sign-in.
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Current session</h3>
                <p className="text-sm text-ink-muted">The signed-in admin account below can also be managed from this page.</p>
              </div>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Signed-in user</dt>
                <dd className="font-medium text-ink">
                  {isLoadingSession
                    ? "Loading session..."
                    : currentUser
                      ? `${currentUser.firstName} ${currentUser.lastName}`
                      : "No active session found"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Role</dt>
                <dd>
                  <Badge tone={isAdmin ? "success" : "neutral"}>
                    {isLoadingSession ? "Loading" : currentUser?.role ?? "Unknown"}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Default new role</dt>
                <dd className="font-medium text-ink">{selectedRole.label}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Temporary password</dt>
                <dd className="flex items-center gap-2 font-medium text-ink">
                  <KeyRound className="h-4 w-4 text-ink-muted" />
                  Minimum 8 characters
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} size="lg">
        <ModalHeader
          title="Edit user"
          subtitle={editingUser ? `${editingUser.firstName} ${editingUser.lastName}` : "Update account details"}
          onClose={() => setEditingUser(null)}
        />
        <form onSubmit={handleEditSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ModalBody className="flex flex-1 flex-col gap-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="First name">
                <Input
                  value={editForm.firstName ?? ""}
                  onChange={(event) => updateEditField("firstName", event.target.value)}
                  required
                />
              </Field>
              <Field label="Last name">
                <Input
                  value={editForm.lastName ?? ""}
                  onChange={(event) => updateEditField("lastName", event.target.value)}
                  required
                />
              </Field>
              <Field label="Work email" className="md:col-span-2">
                <Input
                  type="email"
                  value={editForm.email ?? ""}
                  onChange={(event) => updateEditField("email", event.target.value)}
                  required
                />
              </Field>
              <Field label="Phone number">
                <Input
                  value={editForm.phoneNumber ?? ""}
                  onChange={(event) => updateEditField("phoneNumber", event.target.value)}
                />
              </Field>
              <Field label="Role">
                <Select
                  value={(editForm.role as UserRole | undefined) ?? "recruiter"}
                  onChange={(event) => updateEditField("role", event.target.value as UserRole)}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Department">
                <Input
                  value={editForm.department ?? ""}
                  onChange={(event) => updateEditField("department", event.target.value)}
                />
              </Field>
              <Field label="Location">
                <Input
                  value={editForm.location ?? ""}
                  onChange={(event) => updateEditField("location", event.target.value)}
                />
              </Field>
              <Field label="Profile picture URL" className="md:col-span-2">
                <Input
                  value={editForm.profilePicture ?? ""}
                  onChange={(event) => updateEditField("profilePicture", event.target.value)}
                  placeholder="https://..."
                />
              </Field>
              <Field label="Email verification">
                <Select
                  value={editForm.isEmailVerified ? "verified" : "pending"}
                  onChange={(event) => updateEditField("isEmailVerified", event.target.value === "verified")}
                >
                  <option value="pending">Pending verification</option>
                  <option value="verified">Verified</option>
                </Select>
              </Field>
              <Field label="Role note" hint="Choose admin only when the user needs workspace-level controls.">
                <Input value={roleOptions.find((option) => option.value === editForm.role)?.helper ?? ""} readOnly />
              </Field>
              <Field label="Bio" className="md:col-span-2">
                <Textarea
                  value={editForm.bio ?? ""}
                  onChange={(event) => updateEditField("bio", event.target.value)}
                  placeholder="Short internal note or context about this account"
                />
              </Field>
            </div>

            {editError && (
              <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                {editError}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setEditingUser(null)} disabled={isSavingEdit}>
              Cancel
            </Button>
            <Button type="submit" leftIcon={<PencilLine className="h-4 w-4" />} disabled={isSavingEdit}>
              {isSavingEdit ? "Saving..." : "Save changes"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal open={!!passwordTarget} onClose={() => setPasswordTarget(null)} size="sm">
        <ModalHeader
          title="Reset password"
          subtitle={passwordTarget ? `Set a new temporary password for ${passwordTarget.firstName} ${passwordTarget.lastName}` : undefined}
          onClose={() => setPasswordTarget(null)}
        />
        <form onSubmit={handleResetPassword} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ModalBody className="flex flex-1 flex-col gap-4">
            <Field
              label="New temporary password"
              hint="This becomes the password the user should use for their next sign-in."
            >
              <Input
                type="password"
                autoComplete="new-password"
                value={resetForm.newPassword}
                onChange={(event) => setResetForm((current) => ({ ...current, newPassword: event.target.value }))}
                required
              />
            </Field>

            <Field label="Confirm password">
              <Input
                type="password"
                autoComplete="new-password"
                value={resetForm.confirmPassword}
                onChange={(event) => setResetForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                required
              />
            </Field>

            {resetError && (
              <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                {resetError}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPasswordTarget(null)}
              disabled={isResettingPassword}
            >
              Cancel
            </Button>
            <Button type="submit" leftIcon={<KeyRound className="h-4 w-4" />} disabled={isResettingPassword}>
              {isResettingPassword ? "Resetting..." : "Reset password"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
