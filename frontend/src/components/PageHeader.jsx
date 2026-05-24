export default function PageHeader({ label, title, description, action }) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-nx-border pb-6 sm:mb-8 sm:pb-8 lg:mb-10 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
      <section className="min-w-0 flex-1">
        {label && <p className="label-caps">{label}</p>}
        <h1 className="mt-1 break-words font-display text-2xl font-bold tracking-tight sm:mt-2 sm:text-3xl md:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-nx-muted sm:mt-3 sm:text-base">{description}</p>}
      </section>
      {action && <section className="w-full shrink-0 sm:w-auto [&_.btn-accent]:w-full [&_.btn-outline]:w-full sm:[&_.btn-accent]:w-auto sm:[&_.btn-outline]:w-auto">{action}</section>}
    </header>
  );
}
