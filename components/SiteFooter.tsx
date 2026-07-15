import Image from "next/image";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex w-full max-w-7xl flex-col-reverse items-start justify-between gap-8 px-8 py-10 sm:flex-row sm:px-14">
        <div className="flex flex-col gap-4">
          <p className="font-serif text-[18px] text-primary">Dan &amp; Tyler Photography</p>
          <div className="flex flex-col gap-1 text-[14px] text-secondary sm:flex-row sm:gap-6">
            <a
              href="https://danandtyler.com"
              target="_blank"
              className="transition-colors duration-[180ms] hover:text-accent"
            >
              danandtyler.com
            </a>
            <a
              href="mailto:info@danandtyler.com"
              className="transition-colors duration-[180ms] hover:text-accent"
            >
              info@danandtyler.com
            </a>
            <a
              href="tel:+17147215367"
              className="transition-colors duration-[180ms] hover:text-accent"
            >
              (714) 721-5367
            </a>
            <a
              href="https://instagram.com/danandtyler_photography"
              target="_blank"
              className="transition-colors duration-[180ms] hover:text-accent"
            >
              @danandtyler_photography
            </a>
          </div>
          <p className="text-[13px] text-muted">
            10449 La Ballena Cir, Fountain Valley, CA 92708
          </p>
          <p className="mt-2 font-label font-bold text-[11px] uppercase tracking-[0.18em] text-faint">
            {`© ${year} Dan & Tyler Photography`}
          </p>
        </div>
        <a href="https://danandtyler.com" target="_blank">
          <Image
            src="/brand/logo.png"
            alt="Dan & Tyler Photography"
            width={140}
            height={37}
          />
        </a>
      </div>
    </footer>
  );
}
