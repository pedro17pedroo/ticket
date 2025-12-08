import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Layout
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Products from './pages/Products';
import Trial from './pages/Trial';
import OnboardingNew from './pages/OnboardingNew';
import About from './pages/About';
import Contact from './pages/Contact';
import SaasDashboard from './pages/SaasDashboard';

// Store
import useSaasStore from './store/saasStore';

function App() {
  const { initFromStorage } = useSaasStore();

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  return (
    <div className="App">
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />
      <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <Routes>
          {/* Public Routes with Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="features" element={<Features />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="produtos" element={<Products />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="trial" element={<Trial />} />
          </Route>

          {/* Onboarding without Layout */}
          <Route path="/onboarding" element={<OnboardingNew />} />

          {/* SaaS Admin Dashboard */}
          <Route path="/saas/*" element={<SaasDashboard />} />

          {/* Catch all - 404 */}
          <Route path="*" element={<div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600">Página não encontrada</p>
            </div>
          </div>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
