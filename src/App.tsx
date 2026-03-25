import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FilterPanel } from './components/FilterPanel';
import { ListingGrid } from './components/ListingGrid';
import { ListingMap } from './components/ListingMap';
import { EmptyState } from './components/EmptyState';
import { useListings } from './hooks/useListings';
import { useFilters } from './hooks/useFilters';

type ViewMode = 'grid' | 'map';
type SortOrder = 'default' | 'price-asc' | 'price-desc' | 'area-desc' | 'newest';

function App() {
  const { listings, loading, lastUpdated } = useListings();
  const { filters, filtered, neighborhoods, updateFilter, resetFilters } = useFilters(listings);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');

  const sorted = [...filtered].sort((a, b) => {
    switch (sortOrder) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'area-desc': return b.areaM2 - a.areaM2;
      case 'newest': return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      default: return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando apartamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onToggleFilters={() => setShowFilters(!showFilters)} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar filters - desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-6">
              <FilterPanel
                filters={filters}
                neighborhoods={neighborhoods}
                updateFilter={updateFilter}
                resetFilters={resetFilters}
                totalResults={filtered.length}
              />
            </div>
          </aside>

          {/* Mobile filter overlay */}
          {showFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
              <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-gray-50 p-4 overflow-y-auto shadow-xl">
                <FilterPanel
                  filters={filters}
                  neighborhoods={neighborhoods}
                  updateFilter={updateFilter}
                  resetFilters={resetFilters}
                  totalResults={filtered.length}
                  onClose={() => setShowFilters(false)}
                />
              </div>
            </div>
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-bold text-primary-600">{sorted.length}</span> apartamentos encontrados
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white shadow-sm"
                >
                  <option value="default">Ordenar por</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                  <option value="area-desc">Mayor area</option>
                  <option value="newest">Mas recientes</option>
                </select>
              <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                    viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <svg className="w-4 h-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                  </svg>
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                    viewMode === 'map' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <svg className="w-4 h-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span className="hidden sm:inline">Mapa</span>
                </button>
              </div>
              </div>
            </div>

            {/* Content */}
            {sorted.length === 0 ? (
              <EmptyState onReset={resetFilters} />
            ) : viewMode === 'grid' ? (
              <ListingGrid listings={sorted} />
            ) : (
              <ListingMap listings={sorted} />
            )}
          </main>
        </div>
      </div>

      <Footer lastUpdated={lastUpdated} />
    </div>
  );
}

export default App;
