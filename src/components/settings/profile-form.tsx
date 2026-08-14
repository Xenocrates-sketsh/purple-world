import { useRef, useState, type FormEvent } from "react";
import { Camera } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { getFirestoreDb } from "@/lib/firebase";
import { uploadAvatar } from "@/lib/supabase";
import { useToast } from "@/lib/toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { doc, updateDoc } from "firebase/firestore";
import { paths } from "@/lib/db/paths";

export function ProfileForm() {
  const { user, userDoc, refreshTokenClaims } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(userDoc?.displayName ?? user?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function onSaveName(e: FormEvent) {
    e.preventDefault();
    if (!user || !displayName.trim()) return;
    setSavingName(true);
    try {
      await updateDoc(doc(getFirestoreDb(), paths.users(user.uid)), {
        displayName: displayName.trim(),
      });
      toast("Profile updated", { variant: "success" });
    } catch {
      toast("Could not update profile", { variant: "error" });
    } finally {
      setSavingName(false);
      void refreshTokenClaims();
    }
  }

  async function onPickAvatar(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(user.uid, file);
      await updateDoc(doc(getFirestoreDb(), paths.users(user.uid)), { avatarUrl: url });
      toast("Avatar updated", { variant: "success" });
    } catch (err) {
      toast("Could not upload avatar", { variant: "error", description: err instanceof Error ? err.message : undefined });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader title="Profile" description="How you appear across the platform." />
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={displayName} src={userDoc?.avatarUrl} size="lg" />
            <button
              type="button"
              aria-label="Choose avatar"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm"
            >
              <Camera className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div>
            <p className="font-semibold text-foreground">{displayName || "You"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground">
              {userDoc?.role === "teacher" ? "Teacher account" : "Student account"}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPickAvatar(f);
            }}
          />
        </div>

        <form onSubmit={onSaveName} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Display name" htmlFor="display-name">
              <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
          </div>
          <Button onClick={onSaveName} loading={savingName || uploading}>
            Save name
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}