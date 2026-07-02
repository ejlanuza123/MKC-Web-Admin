// src/components/common/ConfirmDialog.jsx
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-xl max-w-md w-full p-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center mb-4">
          <div className="bg-yellow-100 p-2 rounded-full mr-3">
            <AlertTriangle className="text-yellow-600" size={24} />
          </div>
          <h3 className="text-lg font-bold text-theme-primary">{title || 'Confirm Action'}</h3>
        </div>
        <p className="text-theme-secondary mb-6">{message || 'Are you sure you want to proceed?'}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 border rounded-lg transition-colors duration-300 ${isDarkMode ? 'border-slate-700 text-slate-100 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}