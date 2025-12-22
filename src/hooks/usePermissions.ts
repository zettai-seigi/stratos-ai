import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Permissions, UserRole } from '../types';

interface UsePermissionsOptions {
  corporateEntityId?: string;
  orgUnitId?: string;
}

interface UsePermissionsResult {
  role: UserRole;
  permissions: Permissions;
  canManageStructure: boolean;
  canEditBSC: boolean;
  canManagePortfolio: boolean;
  canManageTasks: boolean;
  canImportExport: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
}

/**
 * Hook to get permissions for a specific context (corporate entity and/or org unit)
 *
 * @example
 * // Get permissions for a specific org unit
 * const { canEditBSC, canManageTasks } = usePermissions({ orgUnitId: 'org-123' });
 *
 * // Get global permissions
 * const { isAdmin, canImportExport } = usePermissions();
 */
export function usePermissions(options: UsePermissionsOptions = {}): UsePermissionsResult {
  const { corporateEntityId, orgUnitId } = options;
  const { getEffectiveRole, getPermissions, isAdmin: globalIsAdmin } = useAuth();

  return useMemo(() => {
    const role = getEffectiveRole(corporateEntityId, orgUnitId);
    const permissions = getPermissions(corporateEntityId, orgUnitId);

    return {
      role,
      permissions,
      canManageStructure: permissions.canManageStructure,
      canEditBSC: permissions.canEditBSC,
      canManagePortfolio: permissions.canManagePortfolio,
      canManageTasks: permissions.canManageTasks,
      canImportExport: permissions.canImportExport,
      isAdmin: role === 'admin',
      isEditor: role === 'editor' || role === 'admin',
      isViewer: true, // Everyone can view
    };
  }, [corporateEntityId, orgUnitId, getEffectiveRole, getPermissions]);
}

/**
 * Hook to check a single permission
 *
 * @example
 * const canEdit = useCanPerform('canEditBSC', { orgUnitId: 'org-123' });
 */
export function useCanPerform(
  action: keyof Permissions,
  options: UsePermissionsOptions = {}
): boolean {
  const { permissions } = usePermissions(options);
  return permissions[action] || false;
}
