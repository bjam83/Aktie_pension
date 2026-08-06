import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Log ind" subtitle="Adgang til jeres husstands pension, investeringer og budget.">
      <LoginForm next={next || "/"} />
    </AuthShell>
  );
}
