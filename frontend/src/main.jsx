import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import { Admin, Home, Login, User } from './pages';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/user" element={<User />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
