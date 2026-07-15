import Image from "next/image";
import { AccessForm } from "@/components/AccessForm";

export function SiteHeader({ slug }: { slug: string }) {
  return (
    <div className="w-full border-b border-hairline bg-canvas">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[28px_1fr_28px] items-center gap-6 px-8 py-2.5 sm:px-14">
        <Image
          src="/brand/badge.png"
          alt="Dan & Tyler Photography"
          width={28}
          height={28}
        />
        <div className="justify-self-center">
          <AccessForm slug={slug} />
        </div>
        <div />
      </div>
    </div>
  );
}
