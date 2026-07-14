export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-10 sm:px-10">
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
        <p className="mt-2 font-label text-[11px] uppercase tracking-[0.1em] text-faint">
          {`© ${year} Dan & Tyler Photography`}
        </p>
      </div>
    </footer>
  );
}
