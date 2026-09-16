interface ReliableLocationToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// ON por default (brief P1 §23) -- se controla desde el estado inicial
// del padre, este componente solo refleja/emite el cambio.
export function ReliableLocationToggle({ checked, onChange }: ReliableLocationToggleProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
      />
      Solo propiedades con ubicación confiable
    </label>
  );
}
