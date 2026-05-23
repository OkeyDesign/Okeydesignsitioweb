import { Link, useLocation } from "react-router";
import Logo1V from "@/imports/Logo1V2-84-544";

export function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  return (
    <nav 
      className="w-full border-b border-gray-200" 
      style={{ 
        fontFamily: 'Mulish, sans-serif',
        backgroundColor: isHome ? 'transparent' : 'white'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="w-24 h-8">
              <Logo1V />
            </div>
          </Link>

          {/* Botón Inicio */}
          <Link 
            to="/"
            className="px-6 py-2 rounded-md text-white font-semibold transition-all hover:scale-105"
            style={{ backgroundColor: '#16273F', fontSize: '17px' }}
          >
            Inicio
          </Link>
        </div>
      </div>
    </nav>
  );
}