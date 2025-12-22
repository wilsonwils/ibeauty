import { Routes, Route, Navigate } from "react-router-dom";
import LoginSign from "./pages/LoginSign";
import Dashboard from "./pages/Dashboard";
import Verify from "./pages/Verify";
import Product from "./pages/Product";
import ProductList from "./pages/ProductList";
import Layout from "./layout/Layout";
import Addproduct from "./pages/Addproduct";
import Setflow from "./pages/Setflow";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import Permission from "./pages/Permission";
import AddPlan from "./pages/AddPlan";

function App() {
  return (
    <Routes>
      {/* Redirect root "/" to /i-beauty */}
      <Route path="/" element={<Navigate to="/i-beauty" replace />} />

      {/* Redirect old routes to new /i-beauty paths */}
      <Route path="/productlist" element={<Navigate to="/i-beauty/productlist" replace />} />
      <Route path="/add-product" element={<Navigate to="/i-beauty/add-product" replace />} />
      <Route path="/dashboard" element={<Navigate to="/i-beauty/dashboard" replace />} />
      <Route path="/verify" element={<Navigate to="/i-beauty/verify" replace />} />
      <Route path="/setflow" element={<Navigate to="/i-beauty/setflow" replace />} />
      <Route path="/edit-profile" element={<Navigate to="/i-beauty/edit-profile" replace />} />
      <Route path="/settings" element={<Navigate to="/i-beauty/settings" replace />} />
      <Route path="/organization-permission" element={<Navigate to="/i-beauty/organization-permission" replace />} />
      <Route path="/add-plan" element={<Navigate to="/i-beauty/add-plan" replace />} />

      {/* No layout pages */}
      <Route path="/i-beauty" element={<LoginSign />} />
      <Route path="/i-beauty/dashboard" element={<Dashboard />} />
      <Route path="/i-beauty/verify" element={<Verify />} />
      

      {/* Pages WITH header + sidebar */}
      <Route
        path="/i-beauty/productlist"
        element={
          <Layout>
            <ProductList />
          </Layout>
        }
      />
      <Route
        path="/i-beauty/product/:name"
        element={
          <Layout>
            <Product />
          </Layout>
        }
      />
      <Route
        path="/i-beauty/add-product"
        element={
          <Layout hideHeader={true}>
            <Addproduct />
          </Layout>
        }
      />

          <Route
      path="/i-beauty/setflow"
      element={
        <Layout>
          <Setflow />
        </Layout>
      }
      />

        <Route
          path="/i-beauty/edit-profile"
          element={
            <Layout>
              <EditProfile />
            </Layout>
          }
        />

        <Route 
          path="/i-beauty/settings"
          element={
            <Layout>
              <Settings />
            </Layout>
          }
        />
        <Route 
          path="/i-beauty/organization-permission"
          element={
            <Layout>
              <Permission />
            </Layout>
          }
        />
        <Route 
          path="/i-beauty/add-plan"
          element={
            <Layout>
              <AddPlan />
            </Layout>
          }
        />


    </Routes>


  );
}

export default App;
