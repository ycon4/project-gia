import { Navigate } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback
}) {
  const { role, loading, hasPermission, isActive } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-gia-600 font-bold text-sm animate-pulse tracking-widest uppercase">
          Loading permissions...
        </div>
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/login" />;
  }

  // Check if user account is active
  if (!isActive) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="max-w-md text-center bg-white dark:bg-neutral-900 border-2 border-rose-200 dark:border-rose-800 rounded-2xl p-8 shadow-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mb-3">
            Access Revoked
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Your account access has been revoked. Please contact an administrator to restore your access.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl font-bold text-sm transition-all shadow-lg"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Check role requirement (hierarchical)
  if (requiredRole) {
    const roleHierarchy = { USER: 1, SECRETARIAT: 2, ADMIN: 3 };
    if (roleHierarchy[role] < roleHierarchy[requiredRole]) {
      return fallback || (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Access Denied
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Access Denied
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
