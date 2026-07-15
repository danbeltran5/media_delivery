import Image from "next/image";
import { AccessForm } from "@/components/AccessForm";

export function SiteHeader({ slug }: { slug: string }) {
  return (
    <div className="w-full border-b border-hairline bg-neutral-50">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-8 py-4 sm:px-14">
        <Image
          src="/brand/badge.png"
          alt="Dan & Tyler Photography"
          width={36}
          height={36}
          className="rounded-full"
        />
        <AccessForm slug={slug} />
      </div>
    </div>
  );
}
