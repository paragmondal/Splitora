import Button from "./Button";

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-surface-50 p-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
        {icon || <span className="text-lg">◎</span>}
      </div>

      <h3 className="text-lg font-semibold text-surface-900">{title || "Nothing here yet"}</h3>

      {description ? <p className="mt-2 max-w-md text-sm text-surface-600">{description}</p> : null}

      {action?.label ? (
        <div className="mt-5">
          <Button onClick={action.onClick} variant={action.variant || "primary"}>
            {action.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
