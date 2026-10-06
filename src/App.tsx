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

function Routes() {
  const route = useRouter();

  // Try matching routes
  const equipmentDetail = matchRoute(route, 'equipment/:id');
  const serviceDetail = matchRoute(route, 'services/:id');

  if (route.path === '/' || route.path === '') return <HomePage />;
  if (matchRoute(route, 'equipment')) return <EquipmentCatalogPage />;
  if (equipmentDetail) return <EquipmentDetailPage id={equipmentDetail.id} />;
  if (matchRoute(route, 'services')) return <ServicesPage />;
  if (serviceDetail) return <ServiceDetailPage id={serviceDetail.id} />;
  if (matchRoute(route, 'checkout')) return <CheckoutPage />;
  if (matchRoute(route, 'account')) return <AccountPage />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold text-slate-900">404</h1>
      <p className="text-slate-500 mt-3">Page not found</p>
      <a href="#/" className="mt-6 inline-block text-blue-600 font-medium hover:underline">
        Go home
      </a>
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Layout>
        <Routes />
      </Layout>
    </CartProvider>
  );
}
