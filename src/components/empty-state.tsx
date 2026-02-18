interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-foreground/15 px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground/70">{title}</p>
      <p className="mt-1 text-sm text-foreground/50">{description}</p>
    </div>
  );
}
