"use client";

import { removeAccountAction } from "@/lib/actions/investments";

export function RemoveAccountButton({ accountId, accountName }: { accountId: string; accountName: string }) {
  return (
    <form
      action={removeAccountAction}
      onSubmit={(e) => {
        if (!confirm(`Slet “${accountName}” og alle poster i den?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={accountId} />
      <button className="btn ghost danger tiny" type="submit">
        Slet konto
      </button>
    </form>
  );
}
