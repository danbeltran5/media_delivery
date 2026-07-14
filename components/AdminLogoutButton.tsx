"use client";

export function AdminLogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.reload();
      }}
      className="font-label text-[12px] uppercase tracking-[0.1em] text-muted underline underline-offset-2 hover:text-accent"
    >
      Log out
    </button>
  );
}
