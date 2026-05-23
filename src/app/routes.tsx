import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { ClienteDashboard } from "./pages/ClienteDashboard";
import { AdminLayout } from "./layouts/AdminLayout";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { ClientsPage } from "./pages/admin/ClientsPage";
import { ClientDetailPage } from "./pages/admin/ClientDetailPage";
import { TeamPage } from "./pages/admin/TeamPage";
import { PortfolioPage } from "./pages/admin/PortfolioPage";
import { PortfolioLayoutPage } from "./pages/admin/PortfolioLayoutPage";
import { BlogPage } from "./pages/admin/BlogPage";
import { ServicesPage } from "./pages/admin/ServicesPage";
import { PricingPage } from "./pages/admin/PricingPage";
import { InvoicesPage } from "./pages/admin/InvoicesPage";
import { MemberProfileEditor } from "./pages/admin/MemberProfileEditor";
import MigrateUsersPage from "./pages/admin/MigrateUsersPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { Outlet } from "react-router";

// Public pages
import { BlogPublicPage } from "./pages/public/BlogPublicPage";
import { BlogArticlePage } from "./pages/public/BlogArticlePage";
import { PortfolioPublicPage } from "./pages/public/PortfolioPublicPage";
import { PortfolioProjectPage } from "./pages/public/PortfolioProjectPage";
import { ServicePublicPage } from "./pages/public/ServicePublicPage";
import { TeamPublicPage } from "./pages/public/TeamPublicPage";
import { MemberProfilePage } from "./pages/public/MemberProfilePage";

// Root component that provides AuthContext to all routes
function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // ── Public site ──────────────────────────────────────────
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/aprende",
        element: <BlogPublicPage />,
      },
      {
        path: "/aprende/:slug",
        element: <BlogArticlePage />,
      },
      {
        path: "/portfolio",
        element: <PortfolioPublicPage />,
      },
      {
        path: "/portfolio/:slug",
        element: <PortfolioProjectPage />,
      },
      {
        path: "/equipo",
        element: <TeamPublicPage />,
      },
      {
        path: "/equipo/:memberId",
        element: <MemberProfilePage />,
      },
      {
        path: "/uxui",
        element: <ServicePublicPage serviceName="uxui" />,
      },
      {
        path: "/branding",
        element: <ServicePublicPage serviceName="branding" />,
      },
      {
        path: "/maker",
        element: <ServicePublicPage serviceName="maker3d" />,
      },

      // ── Portal del cliente (protegido) ────────────────────────
      {
        path: "/okey-client",
        element: (
          <ProtectedRoute allowedType="client">
            <ClienteDashboard />
          </ProtectedRoute>
        ),
      },

      // ── Panel de administración (protegido) ───────────────────
      {
        path: "/okey-admin",
        element: (
          <ProtectedRoute allowedType="admin">
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { 
            path: "dashboard", 
            element: (
              <RoleProtectedRoute allowedRoles={['admin', 'editor']}>
                <DashboardPage />
              </RoleProtectedRoute>
            ) 
          },
          { 
            path: "clientes", 
            element: (
              <RoleProtectedRoute allowedRoles={['admin']}>
                <ClientsPage />
              </RoleProtectedRoute>
            ) 
          },
          { 
            path: "clientes/:id", 
            element: (
              <RoleProtectedRoute allowedRoles={['admin']}>
                <ClientDetailPage />
              </RoleProtectedRoute>
            ) 
          },
          { 
            path: "facturas", 
            element: (
              <RoleProtectedRoute allowedRoles={['admin']}>
                <InvoicesPage />
              </RoleProtectedRoute>
            ) 
          },
          { 
            path: "equipo",   
            element: (
              <RoleProtectedRoute allowedRoles={['admin', 'editor']}>
                <TeamPage />
              </RoleProtectedRoute>
            ) 
          },
          { 
            path: "portafolio", 
            element: (
              <RoleProtectedRoute allowedRoles={['admin', 'editor']}>
                <PortfolioPage />
              </RoleProtectedRoute>
            ) 
          },
          { 
            path: "portafolio/layout", 
            element: (
              <RoleProtectedRoute allowedRoles={['admin', 'editor']}>
                <PortfolioLayoutPage />
              </RoleProtectedRoute>
            ) 
          },
          { 
            path: "blog",     
            element: (
              <RoleProtectedRoute allowedRoles={['admin', 'editor']}>
                <BlogPage />
              </RoleProtectedRoute>
            ) 
          },
          { 
            path: "servicios", 
            element: (
              <RoleProtectedRoute allowedRoles={['admin', 'editor']}>
                <ServicesPage />
              </RoleProtectedRoute>
            ) 
          },
          { 
            path: "precios", 
            element: (
              <RoleProtectedRoute allowedRoles={['admin']}>
                <PricingPage />
              </RoleProtectedRoute>
            ) 
          },
          {
            path: "miembro/:memberId",
            element: (
              <RoleProtectedRoute allowedRoles={['admin', 'editor']}>
                <MemberProfileEditor />
              </RoleProtectedRoute>
            )
          },
          {
            path: "migrate-users",
            element: (
              <RoleProtectedRoute allowedRoles={['admin']}>
                <MigrateUsersPage />
              </RoleProtectedRoute>
            )
          },
        ],
      },
    ],
  },
]);