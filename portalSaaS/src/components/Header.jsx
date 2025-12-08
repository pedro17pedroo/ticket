import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const location = useLocation();

  const orgPortalUrl = import.meta.env.VITE_ORGANIZATION_PORTAL_URL || 'https://organizacao.tatuticket.com';
  const clientPortalUrl = import.meta.env.VITE_CLIENT_PORTAL_URL || 'https://cliente.tatuticket.com';

  const navigation = [
    { name: 'Início', href: '/' },
    { name: 'Funcionalidades', href: '/features' },
    { name: 'Preços', href: '/pricing' },
    { name: 'Sobre', href: '/about' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
              <Ticket className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              TatuTicket
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Products Link */}
            <Link
              to="/produtos"
              className={`text-sm font-medium transition-colors ${
                isActive('/produtos')
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Produtos
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3 relative">
            <div className="relative">
              <button
                onClick={() => setShowLoginOptions((prev) => !prev)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-blue-600 transition-colors"
              >
                Entrar no Portal
              </button>

              {showLoginOptions && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 p-3 z-50">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Escolher portal</p>
                  <button
                    onClick={() => {
                      setShowLoginOptions(false);
                      window.location.href = orgPortalUrl;
                    }}
                    className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    Portal de Organizações
                  </button>
                  <button
                    onClick={() => {
                      setShowLoginOptions(false);
                      window.location.href = clientPortalUrl;
                    }}
                    className="w-full text-left mt-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    Portal de Clientes
                  </button>
                </div>
              )}
            </div>
            <Link
              to="/onboarding"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Começar Agora
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-gray-200 py-4"
            >
              <div className="space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* Mobile Products Link */}
                <Link
                  to="/produtos"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block text-base font-medium transition-colors ${
                    isActive('/produtos')
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Produtos
                </Link>

                {/* Mobile CTA */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="mb-3 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Entrar / Login</p>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        window.location.href = orgPortalUrl;
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:border-blue-200 hover:text-blue-600"
                    >
                      Portal de Organizações
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        window.location.href = clientPortalUrl;
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600"
                    >
                      Portal de Clientes
                    </button>
                  </div>
                  <Link
                    to="/onboarding"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                  >
                    Começar Agora
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Header;
