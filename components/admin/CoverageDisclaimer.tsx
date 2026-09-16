interface CoverageDisclaimerProps {
  blockedSources: string[];
}

const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  buscadorprop: "BuscadorProp",
  zonaprop: "Zonaprop",
  argenprop: "Argenprop",
};

export function CoverageDisclaimer({ blockedSources }: CoverageDisclaimerProps) {
  return (
    <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p>
        ⚠ Con la cobertura actual (muestreo acotado por localidad/fuente) ninguna ausencia puede
        interpretarse como propiedad dada de baja. &quot;Funcionó&quot; significa que la búsqueda
        respondió, no que fue exhaustiva.
      </p>
      {blockedSources.length > 0 && (
        <p>
          {blockedSources.map((s) => SOURCE_DISPLAY_NAMES[s] ?? s).join(", ")} bloqueó el acceso
          automatizado en esta corrida. No se fuerza el acceso — se documenta como limitación
          conocida.
        </p>
      )}
    </div>
  );
}
