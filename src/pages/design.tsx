import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Inbox, Wallet, Users, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PageHeader, StatCard } from "@/components/page-header";
import { Brand } from "@/components/brand";
import { AttachmentList } from "@/components/attachment-list";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {hint ? <p className="mb-4 mt-1 text-sm text-muted-foreground">{hint}</p> : <div className="mb-4" />}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">{children}</CardContent>
      </Card>
    </section>
  );
}

const SWATCHES: { name: string; cls: string }[] = [
  { name: "background", cls: "bg-background border border-border" },
  { name: "surface", cls: "bg-surface border border-border" },
  { name: "surface-muted", cls: "bg-surface-muted" },
  { name: "primary", cls: "bg-primary" },
  { name: "primary-soft", cls: "bg-primary-soft" },
  { name: "accent", cls: "bg-accent" },
  { name: "success-soft", cls: "bg-success-soft" },
  { name: "warning-soft", cls: "bg-warning-soft" },
  { name: "danger-soft", cls: "bg-danger-soft" },
  { name: "info-soft", cls: "bg-info-soft" },
];

const SCREENS: { group: string; routes: { to: string; label: string }[] }[] = [
  {
    group: "Public",
    routes: [
      { to: "/", label: "Welcome" },
      { to: "/login", label: "Student login" },
      { to: "/login/teacher", label: "Teacher login" },
      { to: "/forgot-password", label: "Forgot password" },
    ],
  },
  {
    group: "Teacher",
    routes: [
      { to: "/teacher", label: "Dashboard" },
      { to: "/teacher/students", label: "Students" },
      { to: "/teacher/arrivals", label: "Arrivals" },
      { to: "/teacher/groups", label: "Groups" },
      { to: "/teacher/schedule", label: "Schedule" },
      { to: "/teacher/grades", label: "Grades" },
      { to: "/teacher/exercises", label: "Exercises" },
      { to: "/teacher/announcements", label: "Announcements" },
      { to: "/teacher/lessons", label: "Lessons" },
      { to: "/teacher/payments", label: "Payments" },
      { to: "/teacher/chat", label: "Chat" },
      { to: "/teacher/settings", label: "Settings" },
    ],
  },
  {
    group: "Student",
    routes: [
      { to: "/student", label: "Dashboard" },
      { to: "/student/profile", label: "Profile" },
      { to: "/student/grades", label: "Grades" },
      { to: "/student/group", label: "My group" },
      { to: "/student/payments", label: "Payments" },
      { to: "/student/exercises", label: "Exercises" },
      { to: "/student/announcements", label: "Announcements" },
      { to: "/student/lessons", label: "Lessons" },
      { to: "/student/chat", label: "Chat" },
      { to: "/student/settings", label: "Settings" },
    ],
  },
];

export function DesignGalleryPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <PageHeader
        title="Design Gallery"
        description="Every Purple World building block in one place — Figma-style component library, live from code."
        action={<ThemeToggle />}
      />

      <Section title="Foundation — colors" hint="Swatches from tailwind.config.ts">
        {SWATCHES.map((s) => (
          <div key={s.name} className="flex flex-col items-center gap-1.5">
            <span className={`h-12 w-12 rounded-xl ${s.cls}`} />
            <span className="text-xs text-muted-foreground">{s.name}</span>
          </div>
        ))}
      </Section>

      <Section title="Foundation — type">
        <div className="w-full space-y-2">
          <p className="text-2xl font-bold text-foreground">Heading 2xl bold</p>
          <p className="text-base font-semibold text-foreground">Base semibold</p>
          <p className="text-sm text-foreground">Body sm</p>
          <p className="text-xs text-muted-foreground">Muted xs</p>
        </div>
      </Section>

      <Section title="Buttons">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Add"><Plus className="h-4 w-4" aria-hidden /></Button>
        <Button loading>Loading</Button>
        <Button leftIcon={<Plus className="h-4 w-4" aria-hidden />}>With icon</Button>
      </Section>

      <Section title="Badges & avatars">
        <Badge>neutral</Badge>
        <Badge variant="primary">primary</Badge>
        <Badge variant="success">success</Badge>
        <Badge variant="warning">warning</Badge>
        <Badge variant="danger">danger</Badge>
        <Badge variant="info">info</Badge>
        <Avatar name="Miss Hafsa" size="sm" />
        <Avatar name="Miss Hafsa" size="md" />
        <Avatar name="Miss Hafsa" size="lg" />
      </Section>

      <Section title="Form fields">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Field label="Input" htmlFor="d-input" required hint="Hint text goes here">
            <Input id="d-input" placeholder="Placeholder" />
          </Field>
          <Field label="Select" htmlFor="d-select" error="Something is off">
            <Select id="d-select" defaultValue="b">
              <option value="a">Option A</option>
              <option value="b">Option B</option>
            </Select>
          </Field>
          <Field label="Textarea" htmlFor="d-area" hint="Multiline input">
            <Textarea id="d-area" rows={2} placeholder="Write something…" />
          </Field>
        </div>
      </Section>

      <Section title="Cards & headers">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader title="Card title" description="Card description" action={<Badge variant="primary">New</Badge>} />
            <CardContent>Card content goes here.</CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
          <div className="grid gap-3">
            <StatCard label="Students" value="128" icon={<Users className="h-5 w-5" aria-hidden />} tone="primary" />
            <StatCard label="Revenue" value="$4,200" icon={<Wallet className="h-5 w-5" aria-hidden />} tone="success" />
          </div>
        </div>
        <div className="w-full">
          <PageHeader title="Page header" description="With an action button" action={<Button size="sm">Action</Button>} />
          <Brand />
          <Brand subtitle className="mt-3" />
        </div>
      </Section>

      <Section title="Feedback & overlays">
        <Button variant="secondary" onClick={() => setModalOpen(true)}>Open modal</Button>
        <Button variant="secondary" onClick={() => setConfirmOpen(true)}>Open confirm</Button>
        <Spinner />
        <div className="w-full sm:max-w-xs"><SkeletonList count={2} /></div>
        <div className="w-full">
          <EmptyState icon={Inbox} title="Empty state" description="Nothing here yet." action={<Button size="sm">Do something</Button>} />
        </div>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Modal title" description="Modal description" footer={<Button onClick={() => setModalOpen(false)}>Close</Button>}>
          <p className="text-sm text-muted-foreground">Modal body content.</p>
        </Modal>
        <ConfirmDialog open={confirmOpen} title="Are you sure?" description="This is a confirm dialog." onConfirm={() => setConfirmOpen(false)} onCancel={() => setConfirmOpen(false)} />
      </Section>

      <Section title="Attachments">
        <div className="w-full">
          <AttachmentList urls={["https://example.com/lessons/1234-ab12cd-worksheet.pdf"]} onRemove={() => {}} />
        </div>
      </Section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-foreground">Screen map</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">Every route in the app — click through each screen.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {SCREENS.map((g) => (
            <Card key={g.group}>
              <CardHeader title={g.group} description={`${g.routes.length} screens`} />
              <CardContent>
                <ul className="grid gap-1.5">
                  {g.routes.map((r) => (
                    <li key={r.to}>
                      <Link to={r.to} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground">
                        {g.group === "Teacher" ? <Users className="h-4 w-4" aria-hidden /> : <BookOpen className="h-4 w-4" aria-hidden />}
                        {r.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
