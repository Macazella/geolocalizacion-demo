import { Header } from "@/components/layout/Header";
import { PropertyCardSkeleton } from "@/components/property/PropertyCardSkeleton";

export default function LoadingBuscar() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-md flex-1 space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
