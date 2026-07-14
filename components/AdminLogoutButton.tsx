"use client";

export function AdminLogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.reload();
      }}
      className="font-label font-bold text-[12px] uppercase tracking-[0.18em] text-muted underline underline-offset-2 hover:text-accent"
    >
      Log out
    </button>
  );
}
