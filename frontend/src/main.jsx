import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Dashboard, UserPage, AdminPage, LoginPage } from './pages';

function App(){return <BrowserRouter><div style={{padding:20,fontFamily:'Arial'}}><nav><Link to='/'>Dashboard</Link> | <Link to='/user'>User</Link> | <Link to='/admin'>Admin</Link> | <Link to='/login'>Login</Link></nav><Routes><Route path='/' element={<Dashboard/>}/><Route path='/user' element={<UserPage/>}/><Route path='/admin' element={<AdminPage/>}/><Route path='/login' element={<LoginPage/>}/></Routes></div></BrowserRouter>}
createRoot(document.getElementById('root')).render(<App/>);
