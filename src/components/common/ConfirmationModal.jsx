import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  icon: Icon = AlertTriangle,
  iconColor = 'text-red-500',
}) => {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div
        className={`bg-theme-primary rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300`}
      >
        <div className="p-6">
          <div className="flex items-start">
            <div
              className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-opacity-10 ${
                iconColor.replace('text-', 'bg-')
              } sm:mx-0 sm:h-10 sm:w-10`}
            >
              <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-bold text-theme-primary" id="modal-title">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-theme-secondary">
                  {message}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-theme-secondary transition-colors"
            >
              <X size={18} className="text-theme-secondary" />
            </button>
          </div>
        </div>
        <div className="bg-theme-secondary px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl">
          <button
            type="button"
            disabled={isLoading}
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50`}
            onClick={onConfirm}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-theme-secondary-trans shadow-sm px-4 py-2 bg-theme-primary text-base font-medium text-theme-primary hover:bg-theme-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;