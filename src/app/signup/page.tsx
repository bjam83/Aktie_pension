import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <AuthShell title="Opret bruger" subtitle="Din egen konto med jeres egen private husstandsdata.">
      <SignupForm />
    </AuthShell>
  );
}
