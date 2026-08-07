"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmedPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Bekræfter din konto…");

  useEffect(() => {
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setMsg("Konto bekræftet — omdirigerer…");
        router.replace("/");
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/");
      } else {
        setMsg("Kunne ikke bekræfte automatisk — log ind med din nye konto.");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <AuthShell title="Velkommen" subtitle="">
      <p className="text-[13px]" style={{ color: "var(--muted)" }}>
        {msg}
      </p>
    </AuthShell>
  );
}
