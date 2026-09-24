import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { BAC_STREAMS } from "@/lib/constants";

export interface StudentFormState {
  name: string;
  studentNo: string;
  phone: string;
  parentPhone: string;
  school: string;
  stream: string;
  bacYear: string;
  targetScore: string;
}

export function StudentEditModal({
  open,
  form,
  saving,
  onClose,
  onForm,
  onSave,
}: {
  open: boolean;
  form: StudentFormState | null;
  saving: boolean;
  onClose: () => void;
  onForm: (patch: Partial<StudentFormState>) => void;
  onSave: (e: React.FormEvent) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit student"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} loading={saving}>Save changes</Button>
        </>
      }
    >
      <form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <Input value={form?.name ?? ""} onChange={(e) => onForm({ name: e.target.value })} required />
        </Field>
        <Field label="Student number" required>
          <Input value={form?.studentNo ?? ""} onChange={(e) => onForm({ studentNo: e.target.value })} required />
        </Field>
        <Field label="Phone">
          <Input value={form?.phone ?? ""} onChange={(e) => onForm({ phone: e.target.value })} />
        </Field>
        <Field label="Parent phone">
          <Input value={form?.parentPhone ?? ""} onChange={(e) => onForm({ parentPhone: e.target.value })} />
        </Field>
        <Field label="School">
          <Input value={form?.school ?? ""} onChange={(e) => onForm({ school: e.target.value })} />
        </Field>
        <Field label="BAC stream">
          <Select value={form?.stream ?? ""} onChange={(e) => onForm({ stream: e.target.value })}>
            <option value="">No stream</option>
            {BAC_STREAMS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </Field>
        <Field label="BAC year">
          <Input value={form?.bacYear ?? ""} onChange={(e) => onForm({ bacYear: e.target.value })} />
        </Field>
        <Field label="Target score (/20)">
          <Input type="number" min={0} max={20} step={0.25} value={form?.targetScore ?? ""} onChange={(e) => onForm({ targetScore: e.target.value })} />
        </Field>
      </form>
    </Modal>
  );
}
