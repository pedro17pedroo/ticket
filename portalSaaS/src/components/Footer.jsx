import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Mail, Phone, MapPin } from 'lucide-react';
import { getLandingPageConfig } from '../services/api';

const Footer = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      const data = await getLandingPageConfig();
      if (data) setConfig(data);
    };
    loadConfig();
  }, []);

  const categoryLabels = {
    produto: 'Produto',
    empresa: 'Empresa',
    recursos: 'Recursos',
    suporte: 'Suporte'
  };

  // Valores padrão
  const c = config || {
    brandName: 'TatuTicket',
    footerDescription: 'A plataforma de gestão de tickets mais completa do mercado. Simplifique o atendimento, automatize processos e encante seus clientes.',
    footerEmail: 'contato@tatuticket.com',
    footerPhone: '+55 (11) 99999-9999',
    footerAddress: 'São Paulo, Brasil',
    footerText: '© 2025 TatuTicket. Todos os direitos reservados.',
    newsletterTitle: 'Newsletter',
    newsletterDescription: 'Receba as últimas novidades sobre gestão de tickets e tecnologia.',
    footerLinks: {
      produto: [
        { label: 'Funcionalidades', url: '/features' },
        { label: 'Preços', url: '/pricing' },
        { label: 'Desktop Agent', url: '/desktop-agent' },
        { label: 'Integrações', url: '/integrations' },
        { label: 'API', url: '/api' }
      ],
      empresa: [
        { label: 'Sobre Nós', url: '/about' },
        { label: 'Blog', url: '/blog' },
        { label: 'Carreiras', url: '/careers' },
        { label: 'Parceiros', url: '/partners' },
        { label: 'Imprensa', url: '/press' }
      ],
      recursos: [
        { label: 'Documentação', url: '/docs' },
        { label: 'Tutoriais', url: '/tutorials' },
        { label: 'Status', url: '/status' },
        { label: 'Webinars', url: '/webinars' },
        { label: 'Templates', url: '/templates' }
      ],
      suporte: [
        { label: 'Central de Ajuda', url: '/help' },
        { label: 'Fale Conosco', url: '/contact' },
        { label: 'Comunidade', url: '/community' },
        { label: 'Segurança', url: '/security' },
        { label: 'Compliance', url: '/compliance' }
      ]
    },
    footerLegal: [
      { label: 'Privacidade', url: '/privacy' },
      { label: 'Termos', url: '/terms' },
      { label: 'Cookies', url: '/cookies' }
    ],
    footerSocial: {
      github: 'https://github.com/tatuticket',
      twitter: 'https://twitter.com/tatuticket',
      linkedin: 'https://linkedin.com/company/tatuticket'
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
                <Ticket className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">{c.brandName}</span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-md text-sm leading-relaxed">
              {c.footerDescription}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              {c.footerEmail && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{c.footerEmail}</span>
                </div>
              )}
              {c.footerPhone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{c.footerPhone}</span>
                </div>
              )}
              {c.footerAddress && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{c.footerAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Links */}
          {c.footerLinks && Object.keys(categoryLabels).map(category => (
            c.footerLinks[category] && (
              <div key={category} className="lg:col-span-1">
                <h3 className="text-white font-semibold mb-4">{categoryLabels[category]}</h3>
                <ul className="space-y-2">
                  {c.footerLinks[category].map((link, index) => (
                    <li key={index}>
                      <Link
                        to={link.url}
                        className="text-gray-400 hover:text-white transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          ))}
        </div>

        {/* Newsletter */}
        {c.newsletterTitle && (
          <div className="border-t border-gray-800 pt-8 mt-8">
            <div className="max-w-md">
              <h3 className="text-white font-semibold mb-4">{c.newsletterTitle}</h3>
              <p className="text-gray-400 text-sm mb-4">{c.newsletterDescription}</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                />
                <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-r-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200">
                  Inscrever
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-500 text-sm">{c.footerText}</div>
            
            <div className="flex items-center gap-6">
              {/* Legal Links */}
              {c.footerLegal && (
                <div className="flex items-center gap-4 text-sm">
                  {c.footerLegal.map((link, index) => (
                    <Link key={index} to={link.url} className="text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}

              {/* Social Links */}
              {c.footerSocial && (
                <div className="flex items-center gap-3">
                  {c.footerSocial.github && (
                    <a href={c.footerSocial.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    </a>
                  )}
                  {c.footerSocial.twitter && (
                    <a href={c.footerSocial.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                  )}
                  {c.footerSocial.linkedin && (
                    <a href={c.footerSocial.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
