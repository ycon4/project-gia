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
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Account Inactive
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Your account has been deactivated. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  // Check role requirement (hierarchical)
  if (requiredRole) {
    const roleHierarchy = { USER: 1, ADMIN: 2, SUPER_ADMIN: 3 };
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
