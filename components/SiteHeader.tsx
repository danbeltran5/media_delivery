import Image from "next/image";
import { AccessForm } from "@/components/AccessForm";

export function SiteHeader({
  slug,
  showAccessForm = true,
}: {
  slug: string;
  showAccessForm?: boolean;
}) {
  const badge = (
    <a href="https://danandtyler.com" target="_blank">
      <Image src="/brand/badge.png" alt="Dan & Tyler Photography" width={28} height={28} />
    </a>
  );

  return (
    <div className="w-full border-b border-hairline bg-canvas">
      {showAccessForm ? (
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[28px_1fr_28px] items-center gap-6 px-8 py-2.5 sm:px-14">
          {badge}
          <div className="justify-self-center">
            <AccessForm slug={slug} />
          </div>
          <div />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-7xl justify-start px-8 py-2.5 sm:px-14">
          {badge}
        </div>
      )}
    </div>
  );
}
