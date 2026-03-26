type LegalHoldingPageProps = {
  title: string;
  slug: string;
};

const TODAY = "2026-03-26";

export default function LegalHoldingPage({
  title,
  slug,
}: LegalHoldingPageProps) {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-white pt-28">
      <section className="mx-auto max-w-3xl px-6 pb-24 md:px-10 lg:px-16">
        <div className="border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-8 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.18)] md:p-10">
          <p className="font-sans text-[11px] uppercase tracking-[0.34em] text-black/42">
            {slug}
          </p>
          <h1 className="mt-4 font-serif text-[2.4rem] leading-[0.92] tracking-[-0.06em] text-black md:text-[3.2rem]">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-black/68 md:text-base">
            A detailed {slug.toLowerCase()} page is being prepared. Until then, please contact
            YJ TexLab directly if you need immediate assistance or documentation.
          </p>
          <div className="mt-10 space-y-3 border-t border-black/8 pt-6 text-sm text-black/62">
            <p>Email: yjtexlab@yjtexlab.com</p>
            <p>Phone: +82-53-556-4561</p>
            <p>Last updated: {TODAY}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
