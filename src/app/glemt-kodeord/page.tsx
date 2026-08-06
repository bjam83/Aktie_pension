import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "./ForgotForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Glemt adgangskode" subtitle="Vi sender dig et link til at vælge en ny adgangskode.">
      <ForgotForm />
    </AuthShell>
  );
}
