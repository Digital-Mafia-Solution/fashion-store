"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Upload, User as UserIcon } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { SmartPhoneInput } from "@/components/ui/phone-input";

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
    email: ""
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // FIX 1: Use maybeSingle() instead of single() to avoid PGRST116 error
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
          email: user.email || ""
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      
      // FIX 2: Use upsert instead of update to ensure row exists
      await supabase
        .from("profiles")
        .upsert({ 
            id: user.id,
            avatar_url: publicUrl,
            email: user.email // Ensure required fields are present
        });

      toast.success("Profile picture updated!");
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Error uploading image";
        toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      if (!user) throw new Error("No user logged in");

      // FIX 3: Use upsert instead of update
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          email: user.email
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

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container max-w-2xl py-12 mx-auto px-4 text-foreground">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
      
      <Card className="mb-8 bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Click the image to upload a new one.</CardDescription>
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
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className="text-2xl bg-muted text-muted-foreground"><UserIcon className="w-10 h-10" /></AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Upload className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="font-medium">Upload a new photo</p>
            <p className="text-sm text-muted-foreground">JPG, GIF or PNG. Max 2MB.</p>
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
                onChange={e => setProfile({...profile, first_name: e.target.value})}
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input 
                value={profile.last_name} 
                onChange={e => setProfile({...profile, last_name: e.target.value})}
                className="bg-background border-input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <SmartPhoneInput 
                value={profile.phone} 
                onChange={val => setProfile({...profile, phone: val})} 
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
    </div>
  );
}