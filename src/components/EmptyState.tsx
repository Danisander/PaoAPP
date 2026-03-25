interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <h3 className="text-lg font-semibold text-gray-600 mb-2">No se encontraron apartamentos</h3>
      <p className="text-sm text-gray-400 mb-4 text-center max-w-sm">
        Intenta ajustar los filtros de precio, area o zona para ver mas resultados.
      </p>
      <button
        onClick={onReset}
        className="px-5 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
