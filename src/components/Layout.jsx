
import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-100 min-h-screen overflow-x-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
