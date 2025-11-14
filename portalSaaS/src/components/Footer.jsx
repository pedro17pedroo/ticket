import { Link } from 'react-router-dom';
import { Ticket, Mail, Phone, MapPin, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  const footerSections = [
    {
      title: 'Produto',
      links: [
        { name: 'Funcionalidades', href: '/features' },
        { name: 'Preços', href: '/pricing' },
        { name: 'Desktop Agent', href: '/products/agent' },
        { name: 'Integrações', href: '/products/integrations' },
        { name: 'API', href: '/docs/api' }
      ]
    },
    {
      title: 'Empresa',
      links: [
        { name: 'Sobre Nós', href: '/about' },
        { name: 'Blog', href: '/blog' },
        { name: 'Carreiras', href: '/careers' },
        { name: 'Parceiros', href: '/partners' },
        { name: 'Imprensa', href: '/press' }
      ]
    },
    {
      title: 'Recursos',
      links: [
        { name: 'Documentação', href: '/docs' },
        { name: 'Tutoriais', href: '/tutorials' },
        { name: 'Status', href: '/status' },
        { name: 'Webinars', href: '/webinars' },
        { name: 'Templates', href: '/templates' }
      ]
    },
    {
      title: 'Suporte',
      links: [
        { name: 'Central de Ajuda', href: '/help' },
        { name: 'Fale Conosco', href: '/contact' },
        { name: 'Comunidade', href: '/community' },
        { name: 'Segurança', href: '/security' },
        { name: 'Compliance', href: '/compliance' }
      ]
    }
  ];

  const socialLinks = [
    { name: 'GitHub', icon: Github, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' }
  ];

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
              <span className="text-xl font-bold text-white">
                TatuTicket
              </span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-md">
              A plataforma de gestão de tickets mais completa do mercado. 
              Simplifique o atendimento, automatize processos e encante seus clientes.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm">contato@tatuticket.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm">+55 (11) 99999-9999</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">São Paulo, Brasil</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title} className="lg:col-span-1">
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="max-w-md">
            <h3 className="text-white font-semibold mb-4">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">
              Receba as últimas novidades sobre gestão de tickets e tecnologia.
            </p>
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
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 TatuTicket. Todos os direitos reservados.
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Legal Links */}
              <div className="flex items-center space-x-4 text-sm">
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacidade
                </Link>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Termos
                </Link>
                <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors">
                  Cookies
                </Link>
              </div>

              {/* Social Links */}
              <div className="flex items-center space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                    aria-label={social.name}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
