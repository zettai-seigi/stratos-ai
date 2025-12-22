/**
 * Role-Based Access Control (RBAC) Types
 *
 * Basic role assignment system for corporate entities and org units.
 * Supports Admin, Editor, and Viewer roles with permission inheritance.
 */

export type UserRole = 'admin' | 'editor' | 'viewer';

/**
 * Permission flags that can be granted per role
 */
export interface Permissions {
  canManageStructure: boolean;    // Create/edit/delete corporate entities and org units
  canEditBSC: boolean;            // Manage BSC pillars, KPIs
  canManagePortfolio: boolean;    // Create/edit initiatives, projects
  canManageTasks: boolean;        // Create/edit tasks
  canImportExport: boolean;       // Use import/export features
  canManageUsers: boolean;        // Assign roles to other users
  canViewReports: boolean;        // View dashboards and reports
  canConfigureSettings: boolean;  // Access settings page
}

/**
 * Default permissions for each role
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, Permissions> = {
  admin: {
    canManageStructure: true,
    canEditBSC: true,
    canManagePortfolio: true,
    canManageTasks: true,
    canImportExport: true,
    canManageUsers: true,
    canViewReports: true,
    canConfigureSettings: true,
  },
  editor: {
    canManageStructure: false,
    canEditBSC: true,
    canManagePortfolio: true,
    canManageTasks: true,
    canImportExport: true,
    canManageUsers: false,
    canViewReports: true,
    canConfigureSettings: false,
  },
  viewer: {
    canManageStructure: false,
    canEditBSC: false,
    canManagePortfolio: false,
    canManageTasks: false,
    canImportExport: false,
    canManageUsers: false,
    canViewReports: true,
    canConfigureSettings: false,
  },
};

/**
 * User profile (simplified for local storage)
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarInitials?: string;
  avatarColor?: string;
  isSystemAdmin?: boolean;  // Global admin with unrestricted access
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Assignment of a user role to a corporate entity or org unit
 */
export interface UserEntityAssignment {
  id: string;
  userId: string;

  // Scope of assignment (one must be set)
  corporateEntityId?: string;   // Entity-level access
  orgUnitId?: string;           // Org-unit level access

  role: UserRole;

  // When true, role cascades to all children of this entity/org
  inheritToChildren: boolean;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Role display information
 */
export interface RoleInfo {
  role: UserRole;
  label: string;
  description: string;
  color: string;
}

export const ROLE_INFO: Record<UserRole, RoleInfo> = {
  admin: {
    role: 'admin',
    label: 'Administrator',
    description: 'Full access to manage structure, BSC, portfolio, and users',
    color: '#ef4444', // red
  },
  editor: {
    role: 'editor',
    label: 'Editor',
    description: 'Can edit BSC, portfolio, and tasks but cannot manage structure',
    color: '#f59e0b', // amber
  },
  viewer: {
    role: 'viewer',
    label: 'Viewer',
    description: 'Read-only access to view reports and dashboards',
    color: '#22c55e', // green
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the effective role for a user at a specific entity/org
 * Considers inheritance from parent entities
 */
export function getEffectiveRole(
  userId: string,
  entityId: string | null,
  orgUnitId: string | null,
  assignments: UserEntityAssignment[],
  entityParentMap: Map<string, string | null>, // entityId -> parentId
  orgParentMap: Map<string, string | null>     // orgId -> parentId
): UserRole | null {
  const activeAssignments = assignments.filter(
    a => a.userId === userId && a.isActive
  );

  // Check direct assignment first
  const directAssignment = activeAssignments.find(
    a =>
      (a.corporateEntityId === entityId && !a.orgUnitId) ||
      (a.orgUnitId === orgUnitId && !a.corporateEntityId)
  );
  if (directAssignment) return directAssignment.role;

  // Check org unit parent chain
  if (orgUnitId) {
    let currentOrgId: string | null = orgParentMap.get(orgUnitId) ?? null;
    while (currentOrgId) {
      const parentAssignment = activeAssignments.find(
        a => a.orgUnitId === currentOrgId && a.inheritToChildren
      );
      if (parentAssignment) return parentAssignment.role;
      currentOrgId = orgParentMap.get(currentOrgId) ?? null;
    }
  }

  // Check corporate entity parent chain
  if (entityId) {
    let currentEntityId: string | null = entityParentMap.get(entityId) ?? null;
    while (currentEntityId) {
      const parentAssignment = activeAssignments.find(
        a => a.corporateEntityId === currentEntityId && a.inheritToChildren
      );
      if (parentAssignment) return parentAssignment.role;
      currentEntityId = entityParentMap.get(currentEntityId) ?? null;
    }
  }

  return null;
}

/**
 * Get permissions for a specific role
 */
export function getPermissionsForRole(role: UserRole | null): Permissions {
  if (!role) {
    return {
      canManageStructure: false,
      canEditBSC: false,
      canManagePortfolio: false,
      canManageTasks: false,
      canImportExport: false,
      canManageUsers: false,
      canViewReports: false,
      canConfigureSettings: false,
    };
  }
  return { ...DEFAULT_PERMISSIONS[role] };
}

/**
 * Check if user can perform a specific action
 */
export function canPerformAction(
  permissions: Permissions,
  action: keyof Permissions
): boolean {
  return permissions[action] ?? false;
}

/**
 * Create a new user entity assignment
 */
export function createUserAssignment(
  partial: Partial<UserEntityAssignment> &
    Pick<UserEntityAssignment, 'userId' | 'role'>
): UserEntityAssignment {
  const now = new Date().toISOString();
  return {
    id: partial.id || `assign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: partial.userId,
    corporateEntityId: partial.corporateEntityId,
    orgUnitId: partial.orgUnitId,
    role: partial.role,
    inheritToChildren: partial.inheritToChildren ?? true,
    isActive: partial.isActive ?? true,
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
  };
}

/**
 * Create a new user profile
 */
export function createUser(
  partial: Partial<User> & Pick<User, 'email' | 'displayName'>
): User {
  const now = new Date().toISOString();
  const initials = partial.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return {
    id: partial.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: partial.email,
    displayName: partial.displayName,
    avatarInitials: partial.avatarInitials ?? initials,
    avatarColor: partial.avatarColor ?? '#8a3ffc',
    isActive: partial.isActive ?? true,
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
  };
}

/**
 * Default admin user for new installations
 */
export const DEFAULT_ADMIN_USER: User = {
  id: 'user-admin',
  email: 'admin@example.com',
  displayName: 'System Admin',
  avatarInitials: 'SA',
  avatarColor: '#8a3ffc',
  isSystemAdmin: true,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Default admin assignment (full access to root corporation)
 */
export const DEFAULT_ADMIN_ASSIGNMENT: UserEntityAssignment = {
  id: 'assign-admin-root',
  userId: 'user-admin',
  corporateEntityId: 'corp-root',
  role: 'admin',
  inheritToChildren: true,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
