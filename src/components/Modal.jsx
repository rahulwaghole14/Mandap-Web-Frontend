
import React from 'react';

const Modal = ({ title, isOpen, onClose, children, size = "max-w-lg" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
      <div className={`bg-white p-6 rounded shadow-lg w-full ${size} relative max-h-[90vh] overflow-y-auto`}>
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-xl">×</button>
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default Modal;
