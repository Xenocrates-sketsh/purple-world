import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DAY_LABELS } from "@/lib/constants";

export function GroupEditModal({
  open,
  desc,
  saving,
  onClose,
  onDesc,
  onSave,
}: {
  open: boolean;
  desc: string;
  saving: boolean;
  onClose: () => void;
  onDesc: (v: string) => void;
  onSave: (e: React.FormEvent) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit group info"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} loading={saving}>Save</Button>
        </>
      }
    >
      <form onSubmit={onSave} className="space-y-4">
        <Field label="Description">
          <Textarea value={desc} onChange={(e) => onDesc(e.target.value)} rows={3} />
        </Field>
      </form>
    </Modal>
  );
}

export function GroupSlotModal({
  open,
  day,
  startTime,
  endTime,
  location,
  onClose,
  onDay,
  onStartTime,
  onEndTime,
  onLocation,
  onSave,
}: {
  open: boolean;
  day: number;
  startTime: string;
  endTime: string;
  location: string;
  onClose: () => void;
  onDay: (v: number) => void;
  onStartTime: (v: string) => void;
  onEndTime: (v: string) => void;
  onLocation: (v: string) => void;
  onSave: (e: React.FormEvent) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a weekly slot"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>Add slot</Button>
        </>
      }
    >
      <form onSubmit={onSave} className="space-y-4">
        <Field label="Day" htmlFor="sl-day">
          <Select
            id="sl-day"
            value={day}
            onChange={(e) => onDay(Number(e.target.value))}
          >
            {DAY_LABELS.map((label, i) => (
              <option key={label} value={i}>{label}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start" htmlFor="sl-start" required>
            <Input id="sl-start" type="time" value={startTime} onChange={(e) => onStartTime(e.target.value)} required />
          </Field>
          <Field label="End" htmlFor="sl-end" required>
            <Input id="sl-end" type="time" value={endTime} onChange={(e) => onEndTime(e.target.value)} required />
          </Field>
        </div>
        <Field label="Location">
          <Input value={location} onChange={(e) => onLocation(e.target.value)} placeholder="Classroom, Zoom…" />
        </Field>
      </form>
    </Modal>
  );
}
