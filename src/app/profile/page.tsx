"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  User as UserIcon,
  LogOut,
  Trash2,
} from "lucide-react";
import { User } from "@supabase/supabase-js";

interface ProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string | null;
  email: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    phone: "",
    avatar_url: null,
    email: "",
  });

  // FIX 1: Added missing state for password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading profile:", error);
      }

      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || null,
          email: user.email || "",
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setSaving(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      if (!user) throw new Error("No user logged in");

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));

      await supabase.from("profiles").upsert({
        id: user.id,
        avatar_url: publicUrl,
        email: user.email,
      });

      toast.success("Profile picture updated!");
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Error uploading image";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      if (!user) throw new Error("No user logged in");

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        full_name: `${profile.first_name} ${profile.last_name}`,
        phone: profile.phone,
        email: user.email,
      });

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // FIX 2: Added missing handler for password change
  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      let msg = "Failed to update password";
      if (error instanceof Error) msg = error.message;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setSaving(true);
      if (!user) throw new Error("No user logged in");

      // Update profile to remove avatar_url
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        avatar_url: null,
        email: user.email,
      });

      if (error) throw error;
      setProfile((prev) => ({ ...prev, avatar_url: null }));
      toast.success("Profile picture removed!");
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Error removing profile picture";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    router.push("/login");
    router.refresh();
  };

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="container max-w-2xl py-4 md:py-12 mx-auto px-4 text-foreground">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <Card className="mb-8 bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Click the image to upload a new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative group cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              onChange={handleAvatarUpload}
              disabled={saving}
            />
            <Avatar className="w-24 h-24 border-2 border-border group-hover:border-primary transition-colors">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                <UserIcon className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-medium">Upload a new photo</p>
            <p className="text-sm text-muted-foreground">
              JPG, GIF or PNG. Max 2MB.
            </p>
            {profile.avatar_url && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleRemoveAvatar}
                disabled={saving}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove picture
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your contact details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={profile.first_name}
                onChange={(e) =>
                  setProfile({ ...profile, first_name: e.target.value })
                }
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={profile.last_name}
                onChange={(e) =>
                  setProfile({ ...profile, last_name: e.target.value })
                }
                className="bg-background border-input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={profile.email}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
              className="bg-background border-input"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleUpdate} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      {/* Security Card for Password Change */}
      <Card className="bg-card text-card-foreground border-border mt-8">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="password">New Password</Label>
              <Input
                type="password"
                id="password"
                placeholder="******"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                type="password"
                id="confirmPassword"
                placeholder="******"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button
                onClick={handlePasswordChange}
                disabled={saving || !newPassword || !confirmPassword}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Mobile Logout (Bottom Block) */}
      <Button
        variant="destructive"
        className="w-full md:hidden mt-4"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
