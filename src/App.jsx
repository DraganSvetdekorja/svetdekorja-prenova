import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Category from './pages/Category.jsx';
import Product from './pages/Product.jsx';
import Home from './pages/Home.jsx';
import WishDrawer from './components/WishDrawer.jsx';
import Footer from './components/Footer.jsx';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tapete" element={<Category fixed="tapete" />} />
        <Route path="/k/:grp" element={<Category />} />
        <Route path="/k/:grp/:sub" element={<Category />} />
        <Route path="/iskanje" element={<Category fixed="*" />} />
        <Route path="/kolekcija/:slug" element={<Category />} />
        <Route path="/izdelek/:sku" element={<Product />} />
        <Route path="*" element={<div className="wrap empty">Strani ni mogoče najti.</div>} />
      </Routes>
      <Footer />
      <CartDrawer />
      <WishDrawer />
    </>
  );
}
