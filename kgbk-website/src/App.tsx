import { BrowserRouter, Routes, Route } from "react-router-dom";
import CatalogueSeeder from "./components/CatalogueSeeder";
import { CustomerAuthProvider } from "./context/CustomerAuthContext";
import SiteLayout from "./layouts/SiteLayout";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import ProductDetail from "./pages/ProductDetail";
import LegacyProductRedirect from "./pages/LegacyProductRedirect";
import Wishlist from "./pages/Wishlist";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";
import PolicyPage from "./pages/PolicyPage";
import NotFound from "./pages/NotFound";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminLayout from "./admin/components/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminProductTable from "./admin/pages/AdminProductTable";
import AdminProductForm from "./admin/pages/AdminProductForm";
import AdminCatalogue from "./admin/pages/AdminCatalogue";
import AdminBanners from "./admin/pages/AdminBanners";
import AdminTestimonials from "./admin/pages/AdminTestimonials";
import AdminScheduleCalls from "./admin/pages/AdminScheduleCalls";
import AdminCustomers from "./admin/pages/AdminCustomers";
import AdminCareGuides from "./admin/pages/AdminCareGuides";
import AdminPolicies from "./admin/pages/AdminPolicies";
import AdminImports from "./admin/pages/AdminImports";
import AdminImportBatch from "./admin/pages/AdminImportBatch";
import AdminSettings from "./admin/pages/AdminSettings";
import ProtectedRoute from "./admin/components/ProtectedRoute";

export default function App() {
  return (
    <CatalogueSeeder>
      <CustomerAuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<SiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/collection" element={<Collection />} />
                <Route path="/collection/:categorySlug" element={<Collection />} />
                <Route path="/collection/:categorySlug/:productSlug" element={<ProductDetail />} />
                <Route path="/product/:productSlug" element={<LegacyProductRedirect />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/policies" element={<PolicyPage />} />
                <Route path="/policies/:slug" element={<PolicyPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/products" element={<AdminProductTable />} />
                  <Route path="/admin/products/new" element={<AdminProductForm />} />
                  <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
                  <Route path="/admin/import" element={<AdminImports />} />
                  <Route path="/admin/import/:id" element={<AdminImportBatch />} />
                  <Route path="/admin/catalogue" element={<AdminCatalogue />} />
                  <Route path="/admin/banners" element={<AdminBanners />} />
                  <Route path="/admin/testimonials" element={<AdminTestimonials />} />
                  <Route path="/admin/customers" element={<AdminCustomers />} />
                  <Route path="/admin/care-guides" element={<AdminCareGuides />} />
                  <Route path="/admin/policies" element={<AdminPolicies />} />
                  <Route path="/admin/schedule-calls" element={<AdminScheduleCalls />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
      </CustomerAuthProvider>
    </CatalogueSeeder>
  );
}
