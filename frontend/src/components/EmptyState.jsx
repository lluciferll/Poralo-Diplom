export default function EmptyState({ title, description, action }) {
  return (
    <section className="panel-inset flex flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-12">
      <p className="font-medium text-nx-text">{title}</p>
      {description && <p className="mt-2 max-w-md text-sm leading-relaxed text-nx-muted">{description}</p>}
      {action && <footer className="mt-5 w-full max-w-xs sm:w-auto">{action}</footer>}
    </section>
  );
}
