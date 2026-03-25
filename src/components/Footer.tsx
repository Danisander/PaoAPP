interface FooterProps {
  lastUpdated: string;
}

export function Footer({ lastUpdated }: FooterProps) {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
        <p>PAOAPP &copy; {new Date().getFullYear()} - Busqueda de apartamentos en Bogota</p>
        <p>Datos actualizados: {lastUpdated} | Solo publicaciones de los ultimos 3 meses</p>
      </div>
    </footer>
  );
}
