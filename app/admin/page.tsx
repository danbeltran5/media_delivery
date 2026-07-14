import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AdminClientRow } from "@/components/AdminClientRow";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    return <AdminLoginForm />;
  }

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      videos: {
        include: {
          purchases: { where: { status: "paid" } },
        },
      },
    },
  });

  const rows = clients.map((client) => {
    const paidPurchases = client.videos.flatMap((v) => v.purchases);
    return {
      id: client.id,
      name: client.name,
      slug: client.slug,
      videoCount: client.videos.length,
      purchaseCount: paidPurchases.length,
      downloadedCount: paidPurchases.filter((p) => p.downloadedAt).length,
      revenueCents: paidPurchases.reduce((sum, p) => sum + p.amountCents, 0),
    };
  });

  const totalRevenueCents = rows.reduce((sum, r) => sum + r.revenueCents, 0);
  const totalPurchases = rows.reduce((sum, r) => sum + r.purchaseCount, 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14 sm:px-10">
      <header className="mb-10 flex items-start justify-between">
        <div>
          <Image
            src="/brand/logo.png"
            alt="Dan & Tyler Photography"
            width={160}
            height={43}
            className="mb-6"
          />
          <p className="font-label font-bold text-[14px] uppercase tracking-[0.26em] text-accent">
            Admin
          </p>
          <h1 className="mt-2 font-serif text-[32px] text-primary">
            Clients
          </h1>
          <p className="mt-2 text-[15px] text-secondary">
            {rows.length} client{rows.length === 1 ? "" : "s"} &middot;{" "}
            {totalPurchases} purchase{totalPurchases === 1 ? "" : "s"} &middot;{" "}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(totalRevenueCents / 100)}{" "}
            total
          </p>
        </div>
        <AdminLogoutButton />
      </header>

      {rows.length === 0 ? (
        <p className="text-secondary">No clients yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-line bg-card">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-hairline">
                <th className="px-4 py-3 text-left font-label font-bold text-[11px] uppercase tracking-[0.18em] text-muted">
                  Client
                </th>
                <th className="px-4 py-3 text-left font-label font-bold text-[11px] uppercase tracking-[0.18em] text-muted">
                  Videos
                </th>
                <th className="px-4 py-3 text-left font-label font-bold text-[11px] uppercase tracking-[0.18em] text-muted">
                  Purchases
                </th>
                <th className="px-4 py-3 text-left font-label font-bold text-[11px] uppercase tracking-[0.18em] text-muted">
                  Downloaded
                </th>
                <th className="px-4 py-3 text-left font-label font-bold text-[11px] uppercase tracking-[0.18em] text-muted">
                  Revenue
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <AdminClientRow key={row.id} {...row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
