import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const success = useCallback((msg, dur) => addToast(msg, 'success', dur), [addToast]);
    const error = useCallback((msg, dur) => addToast(msg, 'error', dur), [addToast]);
    const warn = useCallback((msg, dur) => addToast(msg, 'warning', dur), [addToast]);
    const info = useCallback((msg, dur) => addToast(msg, 'info', dur), [addToast]);

    const value = React.useMemo(() => ({
        success, error, warn, info, removeToast
    }), [success, error, warn, info, removeToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} {...toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ message, type, onRemove }) => {
    const icons = {
        success: <CheckCircle className="toast-icon" />,
        error: <XCircle className="toast-icon" />,
        warning: <AlertCircle className="toast-icon" />,
        info: <Info className="toast-icon" />
    };

    return (
        <div className={`toast-item ${type}`}>
            {icons[type]}
            <div className="toast-message">{message}</div>
            <button className="toast-close" onClick={onRemove}>
                <X size={16} />
            </button>
        </div>
    );
};
