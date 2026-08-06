import { AuthShell } from "@/components/auth/AuthShell";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <AuthShell title="Vælg ny adgangskode" subtitle="">
      <UpdatePasswordForm />
    </AuthShell>
  );
}
