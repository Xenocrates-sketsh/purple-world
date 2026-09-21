import { useRef, useState, type FormEvent } from "react";
import { Camera } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { getFirestoreDb } from "@/lib/firebase";
import { uploadAvatar } from "@/lib/supabase";
import { FRUIT_AVATARS, fruitAvatarSrc } from "@/lib/constants";
import { useToast } from "@/lib/toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { doc, updateDoc } from "firebase/firestore";
import { paths } from "@/lib/db/paths";
import { cn } from "@/lib/cn";

export function ProfileForm() {
  const { user, userDoc, refreshTokenClaims } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(userDoc?.displayName ?? user?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isStudent = userDoc?.role === "student";

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

  async function onPickFruit(key: string) {
    if (!user) return;
    setUploading(true);
    try {
      const db = getFirestoreDb();
      await updateDoc(doc(db, paths.users(user.uid)), { avatarKey: key, avatarUrl: null });
      if (userDoc?.studentId) {
        await updateDoc(doc(db, paths.students(userDoc.studentId)), { avatarKey: key });
      }
      toast("Avatar updated", { variant: "success" });
    } catch {
      toast("Could not update avatar", { variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Profile" description="How you appear across the platform." />
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar
            name={displayName}
            src={userDoc?.avatarUrl ?? fruitAvatarSrc(userDoc?.avatarKey)}
            size="lg"
          />
          <div>
            <p className="font-semibold text-foreground">{displayName || "You"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground">
              {userDoc?.role === "teacher" ? "Teacher account" : "Student account"}
            </p>
          </div>
        </div>

        {isStudent ? (
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Pick your avatar</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Choose a fruit or vegetable — no photo uploads needed.
            </p>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {FRUIT_AVATARS.map((a) => {
                const selected = userDoc?.avatarKey === a.key;
                return (
                  <button
                    key={a.key}
                    type="button"
                    title={a.label}
                    aria-label={`${a.label} avatar`}
                    aria-pressed={selected}
                    disabled={uploading}
                    onClick={() => onPickFruit(a.key)}
                    className={cn(
                      "flex aspect-square w-full items-center justify-center rounded-2xl border transition-transform hover:scale-110 disabled:opacity-50",
                      selected
                        ? "border-primary bg-primary-soft ring-2 ring-primary"
                        : "border-border bg-surface-muted"
                    )}
                  >
                    <img src={a.img} alt="" className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="relative w-fit">
            <Avatar name={displayName} src={userDoc?.avatarUrl ?? fruitAvatarSrc(userDoc?.avatarKey)} size="lg" />
            <button
              type="button"
              aria-label="Choose avatar"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm"
            >
              <Camera className="h-4 w-4" aria-hidden />
            </button>
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
        )}

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