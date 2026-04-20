"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Save, RefreshCw, Shield, UserCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import {
  changePassword,
  fetchProfile,
  updatePreferences,
  updateProfile,
  type NotificationPreferences,
  type ThemePreference,
  type LanguagePreference,
} from "@/lib/auth";

interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  department: string;
  location: string;
  bio: string;
  profilePicture: string;
}

interface PreferencesFormState {
  themePreference: ThemePreference;
  languagePreference: LanguagePreference;
  notifications: NotificationPreferences;
}

const defaultNotifications: NotificationPreferences = {
  screening: true,
  applicants: true,
  export: true,
  system: true,
};

const defaultProfile: ProfileFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  department: "",
  location: "",
  bio: "",
  profilePicture: "",
};

const defaultPreferences: PreferencesFormState = {
  themePreference: "system",
  languagePreference: "en",
  notifications: defaultNotifications,
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profile, setProfile] = useState<ProfileFormState>(defaultProfile);
  const [preferences, setPreferences] = useState<PreferencesFormState>(defaultPreferences);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchProfile();
      const user = response.user;

      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        department: user.department || "",
        location: user.location || "",
        bio: user.bio || "",
        profilePicture: user.profilePicture || "",
      });

      setPreferences({
        themePreference: user.themePreference || "system",
        languagePreference: user.languagePreference || "en",
        notifications: user.notificationPreferences || defaultNotifications,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const disableSave = useMemo(
    () => savingProfile || savingPreferences || changingPassword || loading,
    [savingProfile, savingPreferences, changingPassword, loading]
  );

  const onSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phoneNumber: profile.phoneNumber || undefined,
        department: profile.department || undefined,
        location: profile.location || undefined,
        bio: profile.bio || undefined,
        profilePicture: profile.profilePicture || undefined,
      });
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const onSavePreferences = async (event: FormEvent) => {
    event.preventDefault();
    setSavingPreferences(true);
    setError(null);
    setSuccess(null);

    try {
      await updatePreferences({
        themePreference: preferences.themePreference,
        languagePreference: preferences.languagePreference,
        notificationPreferences: preferences.notifications,
      });
      setSuccess("Preferences updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update preferences.");
    } finally {
      setSavingPreferences(false);
    }
  };

  const onChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setChangingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setSuccess("Password updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="w-full px-6 py-5">
      <PageHeader
        title="Account Settings"
        description="Manage your profile, preferences, and security using live backend data."
        actions={
          <Button variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => void loadData()}>
            Refresh
          </Button>
        }
      />

      {(error || success) && (
        <div className="mt-4 rounded-md border border-line bg-surface p-4 text-sm">
          {error && <p className="text-danger">{error}</p>}
          {success && <p className="text-success">{success}</p>}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <UserCircle2 className="h-5 w-5 text-brand" />
            <h2 className="font-display text-lg font-semibold text-ink">Profile</h2>
          </div>

          <form className="space-y-4" onSubmit={onSaveProfile}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="First Name">
                <Input
                  value={profile.firstName}
                  onChange={(event) => setProfile((prev) => ({ ...prev, firstName: event.target.value }))}
                  disabled={loading}
                  required
                />
              </Field>
              <Field label="Last Name">
                <Input
                  value={profile.lastName}
                  onChange={(event) => setProfile((prev) => ({ ...prev, lastName: event.target.value }))}
                  disabled={loading}
                  required
                />
              </Field>
            </div>

            <Field label="Email">
              <Input
                type="email"
                value={profile.email}
                onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
                disabled={loading}
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Phone Number">
                <Input
                  value={profile.phoneNumber}
                  onChange={(event) => setProfile((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                  disabled={loading}
                />
              </Field>
              <Field label="Department">
                <Input
                  value={profile.department}
                  onChange={(event) => setProfile((prev) => ({ ...prev, department: event.target.value }))}
                  disabled={loading}
                />
              </Field>
            </div>

            <Field label="Location">
              <Input
                value={profile.location}
                onChange={(event) => setProfile((prev) => ({ ...prev, location: event.target.value }))}
                disabled={loading}
              />
            </Field>

            <Field label="Profile Picture URL">
              <Input
                value={profile.profilePicture}
                onChange={(event) => setProfile((prev) => ({ ...prev, profilePicture: event.target.value }))}
                disabled={loading}
              />
            </Field>

            <Field label="Bio">
              <Textarea
                rows={4}
                value={profile.bio}
                onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
                disabled={loading}
              />
            </Field>

            <Button type="submit" leftIcon={<Save className="h-4 w-4" />} disabled={disableSave}>
              {savingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Preferences</h2>

            <form className="mt-4 space-y-4" onSubmit={onSavePreferences}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Theme">
                  <Select
                    value={preferences.themePreference}
                    onChange={(event) =>
                      setPreferences((prev) => ({ ...prev, themePreference: event.target.value as ThemePreference }))
                    }
                    disabled={loading}
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </Select>
                </Field>

                <Field label="Language">
                  <Select
                    value={preferences.languagePreference}
                    onChange={(event) =>
                      setPreferences((prev) => ({ ...prev, languagePreference: event.target.value as LanguagePreference }))
                    }
                    disabled={loading}
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="rw">Kinyarwanda</option>
                  </Select>
                </Field>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-ink">Notification Preferences</p>
                <div className="space-y-2">
                  {(Object.entries(preferences.notifications) as Array<[keyof NotificationPreferences, boolean]>).map(([key, enabled]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={enabled}
                        disabled={loading}
                        onChange={(event) =>
                          setPreferences((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              [key]: event.target.checked,
                            },
                          }))
                        }
                      />
                      <span className="capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" leftIcon={<Save className="h-4 w-4" />} disabled={disableSave}>
                {savingPreferences ? "Saving..." : "Save Preferences"}
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand" />
              <h2 className="font-display text-lg font-semibold text-ink">Security</h2>
            </div>

            <form className="space-y-4" onSubmit={onChangePassword}>
              <Field label="Current Password">
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  disabled={loading}
                  required
                />
              </Field>
              <Field label="New Password">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={loading}
                  required
                />
              </Field>

              <Button type="submit" leftIcon={<Save className="h-4 w-4" />} disabled={disableSave}>
                {changingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
