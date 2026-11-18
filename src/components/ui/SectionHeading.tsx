interface SectionHeadingProps {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  aside?: React.ReactNode;
}

export function SectionHeading({ index, eyebrow, title, description, aside }: SectionHeadingProps) {
  return (
    <div className="mb-8 flex flex-col gap-6 border-t border-white/10 pt-6 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="font-display text-[10px] text-hev">{index}</span>
          <span className="h-px w-8 bg-white/15" />
          <span className="eyebrow">{eyebrow}</span>
        </div>
        <h2 className="text-balance font-display text-4xl font-medium tracking-[-0.045em] sm:text-5xl lg:text-6xl">
          {title}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45 sm:text-base">{description}</p>
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}
