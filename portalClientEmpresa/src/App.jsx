import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TicketDetail from './pages/TicketDetail'
import KnowledgeBase from './pages/KnowledgeBase'
import Profile from './pages/Profile'
import Users from './pages/Users'
import Directions from './pages/Directions'
import Departments from './pages/Departments'
import Sections from './pages/Sections'
import HoursBank from './pages/HoursBank'
import ServiceCatalog from './pages/ServiceCatalog'
import ServiceCatalogEnhanced from './pages/ServiceCatalogEnhanced'
import ServiceCatalogHierarchical from './pages/ServiceCatalogHierarchical'
import MyRequests from './pages/MyRequests'
import MyAssets from './pages/MyAssets'
import MyAssetDetail from './pages/MyAssetDetail'
import Organization from './pages/Organization'

const PrivateRoute = ({ children }) => {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#0ea5e9',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tickets/:id" element={<TicketDetail />} />
                  <Route path="/knowledge" element={<KnowledgeBase />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/directions" element={<Directions />} />
                  <Route path="/departments" element={<Departments />} />
                  <Route path="/sections" element={<Sections />} />
                  <Route path="/hours-bank" element={<HoursBank />} />
                  <Route path="/catalog" element={<ServiceCatalog />} />
                  <Route path="/service-catalog" element={<ServiceCatalogHierarchical />} />
                  <Route path="/my-requests" element={<MyRequests />} />
                  <Route path="/my-assets" element={<MyAssets />} />
                  <Route path="/my-assets/:id" element={<MyAssetDetail />} />
                  <Route path="/organization" element={<Organization />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
