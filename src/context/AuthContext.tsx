import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useApp } from './AppContext';
import {
  User,
  UserRole,
  Permissions,
  UserEntityAssignment,
  getPermissionsForRole,
  DEFAULT_PERMISSIONS,
} from '../types';

interface AuthContextType {
  // Current user
  currentUserId: string | null;
  currentUser: User | undefined;
  isAuthenticated: boolean;

  // Permission helpers
  getEffectiveRole: (corporateEntityId?: string, orgUnitId?: string) => UserRole;
  getPermissions: (corporateEntityId?: string, orgUnitId?: string) => Permissions;
  canPerform: (action: keyof Permissions, corporateEntityId?: string, orgUnitId?: string) => boolean;

  // Convenience permission checks
  canManageStructure: (corporateEntityId?: string) => boolean;
  canEditBSC: (orgUnitId?: string) => boolean;
  canManagePortfolio: (orgUnitId?: string) => boolean;
  canManageTasks: (orgUnitId?: string) => boolean;
  canImportExport: () => boolean;

  // User management (admin only)
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    state,
    getCurrentUser,
    getUserAssignments,
    getCorporateEntityAncestors,
    getOrgUnitAncestors,
    getOrgUnit,
  } = useApp();

  const currentUserId = state.currentUserId || null;
  const currentUser = getCurrentUser();
  const isAuthenticated = !!currentUser;

  // Get user assignments for current user
  const userAssignments = useMemo(() => {
    if (!currentUserId) return [];
    return getUserAssignments(currentUserId).filter((a) => a.isActive);
  }, [currentUserId, getUserAssignments]);

  // Get effective role for a specific entity or org unit
  const getEffectiveRole = useCallback(
    (corporateEntityId?: string, orgUnitId?: string): UserRole => {
      if (!currentUser) return 'viewer';

      // System admin always has admin access
      if (currentUser.isSystemAdmin) return 'admin';

      // Check direct assignments first
      let highestRole: UserRole = 'viewer';

      for (const assignment of userAssignments) {
        // Direct match on corporate entity
        if (corporateEntityId && assignment.corporateEntityId === corporateEntityId) {
          if (roleWeight(assignment.role) > roleWeight(highestRole)) {
            highestRole = assignment.role;
          }
        }

        // Direct match on org unit
        if (orgUnitId && assignment.orgUnitId === orgUnitId) {
          if (roleWeight(assignment.role) > roleWeight(highestRole)) {
            highestRole = assignment.role;
          }
        }

        // Check inherited permissions from parent entities
        if (assignment.inheritToChildren && assignment.corporateEntityId && corporateEntityId) {
          const ancestors = getCorporateEntityAncestors(corporateEntityId);
          if (ancestors.some((a) => a.id === assignment.corporateEntityId)) {
            if (roleWeight(assignment.role) > roleWeight(highestRole)) {
              highestRole = assignment.role;
            }
          }
        }

        // Check inherited permissions from parent org units
        if (assignment.inheritToChildren && assignment.orgUnitId && orgUnitId) {
          const ancestors = getOrgUnitAncestors(orgUnitId);
          if (ancestors.some((a) => a.id === assignment.orgUnitId)) {
            if (roleWeight(assignment.role) > roleWeight(highestRole)) {
              highestRole = assignment.role;
            }
          }
        }

        // Global assignments (no specific entity/org)
        if (!assignment.corporateEntityId && !assignment.orgUnitId) {
          if (roleWeight(assignment.role) > roleWeight(highestRole)) {
            highestRole = assignment.role;
          }
        }
      }

      // If we have an orgUnitId but no corporateEntityId, check the org unit's company
      if (orgUnitId && !corporateEntityId) {
        const orgUnit = getOrgUnit(orgUnitId);
        if (orgUnit?.companyId) {
          const companyRole = getEffectiveRole(orgUnit.companyId, undefined);
          if (roleWeight(companyRole) > roleWeight(highestRole)) {
            highestRole = companyRole;
          }
        }
      }

      return highestRole;
    },
    [currentUser, userAssignments, getCorporateEntityAncestors, getOrgUnitAncestors, getOrgUnit]
  );

  // Get permissions for a specific context
  const getPermissions = useCallback(
    (corporateEntityId?: string, orgUnitId?: string): Permissions => {
      const role = getEffectiveRole(corporateEntityId, orgUnitId);
      return getPermissionsForRole(role);
    },
    [getEffectiveRole]
  );

  // Check if user can perform a specific action
  const canPerform = useCallback(
    (action: keyof Permissions, corporateEntityId?: string, orgUnitId?: string): boolean => {
      const permissions = getPermissions(corporateEntityId, orgUnitId);
      return permissions[action] || false;
    },
    [getPermissions]
  );

  // Convenience methods
  const canManageStructure = useCallback(
    (corporateEntityId?: string) => canPerform('canManageStructure', corporateEntityId),
    [canPerform]
  );

  const canEditBSC = useCallback(
    (orgUnitId?: string) => canPerform('canEditBSC', undefined, orgUnitId),
    [canPerform]
  );

  const canManagePortfolio = useCallback(
    (orgUnitId?: string) => canPerform('canManagePortfolio', undefined, orgUnitId),
    [canPerform]
  );

  const canManageTasks = useCallback(
    (orgUnitId?: string) => canPerform('canManageTasks', undefined, orgUnitId),
    [canPerform]
  );

  const canImportExport = useCallback(() => canPerform('canImportExport'), [canPerform]);

  // Check if current user is admin (has global admin role or is system admin)
  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.isSystemAdmin) return true;

    // Check for global admin assignment
    return userAssignments.some(
      (a) => a.role === 'admin' && !a.corporateEntityId && !a.orgUnitId
    );
  }, [currentUser, userAssignments]);

  const value: AuthContextType = {
    currentUserId,
    currentUser,
    isAuthenticated,
    getEffectiveRole,
    getPermissions,
    canPerform,
    canManageStructure,
    canEditBSC,
    canManagePortfolio,
    canManageTasks,
    canImportExport,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper to weight roles for comparison
function roleWeight(role: UserRole): number {
  switch (role) {
    case 'admin':
      return 3;
    case 'editor':
      return 2;
    case 'viewer':
      return 1;
    default:
      return 0;
  }
}

// PermissionGate component for conditional rendering based on permissions
interface PermissionGateProps {
  action: keyof Permissions;
  corporateEntityId?: string;
  orgUnitId?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  action,
  corporateEntityId,
  orgUnitId,
  children,
  fallback = null,
}) => {
  const { canPerform } = useAuth();

  if (canPerform(action, corporateEntityId, orgUnitId)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
