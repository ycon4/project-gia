import { useRole } from '../contexts/RoleContext';

export default function ConditionalRender({
  children,
  permission,
  role: requiredRole,
  fallback = null
}) {
  const { role, hasPermission } = useRole();

  // Check permission requirement
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // Check role requirement (hierarchical)
  if (requiredRole) {
    const roleHierarchy = { USER: 1, SECRETARIAT: 2, ADMIN: 3 };
    if (!role || roleHierarchy[role] < roleHierarchy[requiredRole]) {
      return fallback;
    }
  }

  return children;
}
