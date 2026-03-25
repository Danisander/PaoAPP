import type { FilterState } from '../types/listing';

interface FilterPanelProps {
  filters: FilterState;
  neighborhoods: string[];
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  totalResults: number;
  onClose?: () => void;
}

export function FilterPanel({ filters, neighborhoods, updateFilter, resetFilters, totalResults, onClose }: FilterPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Filtros</h2>
        <div className="flex gap-2">
          <button
            onClick={resetFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Limpiar
          </button>
          {onClose && (
            <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          )}
        </div>
      </div>

      {/* Operation type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {([['all', 'Todos'], ['rent', 'Arriendo'], ['sale', 'Venta']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => updateFilter('operationType', val)}
              className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${
                filters.operationType === val
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range - input fields */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Precio (COP)</label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Mínimo</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={filters.priceMin === 0 ? '' : filters.priceMin.toLocaleString('es-CO')}
                onChange={(e) => {
                  const num = Number(e.target.value.replace(/\D/g, ''));
                  updateFilter('priceMin', isNaN(num) ? 0 : num);
                }}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg pl-6 pr-2 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <span className="text-gray-300 mt-5">—</span>
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Máximo</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={filters.priceMax === 1_500_000_000 ? '' : filters.priceMax.toLocaleString('es-CO')}
                onChange={(e) => {
                  const num = Number(e.target.value.replace(/\D/g, ''));
                  updateFilter('priceMax', isNaN(num) || num === 0 ? 1_500_000_000 : num);
                }}
                placeholder="Sin límite"
                className="w-full border border-gray-300 rounded-lg pl-6 pr-2 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Area range - input fields */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Área (m²)</label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Mínimo</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={filters.areaMin === 0 ? '' : filters.areaMin}
                onChange={(e) => {
                  const num = Number(e.target.value.replace(/\D/g, ''));
                  updateFilter('areaMin', isNaN(num) ? 0 : num);
                }}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">m²</span>
            </div>
          </div>
          <span className="text-gray-300 mt-5">—</span>
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Máximo</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={filters.areaMax === 300 ? '' : filters.areaMax}
                onChange={(e) => {
                  const num = Number(e.target.value.replace(/\D/g, ''));
                  updateFilter('areaMax', isNaN(num) || num === 0 ? 300 : num);
                }}
                placeholder="Sin límite"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">m²</span>
            </div>
          </div>
        </div>
      </div>

      {/* Neighborhood */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Zona</label>
        <select
          value={filters.neighborhood}
          onChange={(e) => updateFilter('neighborhood', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Todas las zonas</option>
          {neighborhoods.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <p className="text-sm text-gray-500 text-center">
          <span className="font-bold text-primary-600">{totalResults}</span> apartamentos encontrados
        </p>
      </div>
    </div>
  );
}
