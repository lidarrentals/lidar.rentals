import { CartProvider } from '@/context/CartContext';
import { useRouter, matchRoute } from '@/lib/router';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import EquipmentCatalogPage from '@/pages/EquipmentCatalogPage';
import EquipmentDetailPage from '@/pages/EquipmentDetailPage';
import ServicesPage from '@/pages/ServicesPage';
import ServiceDetailPage from '@/pages/ServiceDetailPage';
import CheckoutPage from '@/pages/CheckoutPage';
import AccountPage from '@/components/AccountPage';
import AdminDashboard from './pages/AdminDashboard';

function Routes() {
  const route = useRouter();
  const cleanRoute = route.startsWith('/') ? route : '/' + route;
  const equipmentDetail = cleanRoute.match(/^\/equipment\/([^/]+)$/);
  const serviceDetail = cleanRoute.match(/^\/services\/([^/]+)$/);

  if (cleanRoute === '/' || cleanRoute === '') return <HomePage />;
  if (matchRoute(cleanRoute, '/equipment')) return <EquipmentCatalogPage />;
  if (equipmentDetail) return <EquipmentDetailPage id={decodeURIComponent(equipmentDetail[1])} />;
  if (matchRoute(cleanRoute, '/services')) return <ServicesPage />;
  if (serviceDetail) return <ServiceDetailPage id={decodeURIComponent(serviceDetail[1])} />;
  if (matchRoute(cleanRoute, '/checkout')) return <CheckoutPage />;
  if (matchRoute(cleanRoute, '/account')) return <AccountPage />;
  if (matchRoute(cleanRoute, '/admin')) return <AdminDashboard />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold text-slate-900">404</h1>
      <p className="text-slate-500 mt-3">Page not found</p>
      <a href="#/" className="mt-6 inline-block text-blue-600 font-medium hover:underline">Go home</a>
    </div>
  );
}

export default function App() {
  return <CartProvider><Layout><Routes /></Layout></CartProvider>;
}
