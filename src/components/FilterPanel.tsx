import type { FilterState } from '../types/listing';
import { formatPriceShort } from '../utils/formatPrice';

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

      {/* Price range */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Precio</label>
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{formatPriceShort(filters.priceMin)}</span>
          <span>{formatPriceShort(filters.priceMax)}</span>
        </div>
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={1_500_000_000}
            step={10_000_000}
            value={filters.priceMin}
            onChange={(e) => updateFilter('priceMin', Number(e.target.value))}
            className="w-full"
          />
          <input
            type="range"
            min={0}
            max={1_500_000_000}
            step={10_000_000}
            value={filters.priceMax}
            onChange={(e) => updateFilter('priceMax', Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Area range */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Area (m²)</label>
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{filters.areaMin} m²</span>
          <span>{filters.areaMax} m²</span>
        </div>
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={300}
            step={5}
            value={filters.areaMin}
            onChange={(e) => updateFilter('areaMin', Number(e.target.value))}
            className="w-full"
          />
          <input
            type="range"
            min={0}
            max={300}
            step={5}
            value={filters.areaMax}
            onChange={(e) => updateFilter('areaMax', Number(e.target.value))}
            className="w-full"
          />
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
