import Image from "next/image";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <Image
        src="/brand/logo.png"
        alt="Dan & Tyler Photography"
        width={220}
        height={59}
        className="mb-2"
      />
      <h1 className="font-label font-bold text-[13px] uppercase tracking-[0.26em] text-muted">
        Client Video Portal
      </h1>
      <p className="text-secondary">
        This is an internal tool. Send clients their private link, e.g.{" "}
        <code className="rounded-xs border border-line bg-canvas px-1.5 py-0.5 text-[14px]">
          /c/their-slug
        </code>
        .
      </p>
    </main>
  );
}
