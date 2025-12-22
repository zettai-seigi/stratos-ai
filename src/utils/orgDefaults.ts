// Default Organization Hierarchy Configuration
// Note: 'company' level has been moved to Corporate Entities (see corporate.ts)

import { OrgUnit, OrgHierarchyConfig, OrgLevel, DEFAULT_ORG_CONFIG as BASE_ORG_CONFIG } from '../types/organization';

// Re-export the default config from organization.ts
export const DEFAULT_ORG_CONFIG = BASE_ORG_CONFIG;

/**
 * Generate a timestamp for record creation
 */
const getTimestamp = () => new Date().toISOString();

/**
 * Get the level name from config
 */
export function getLevelName(
  level: OrgLevel,
  config: OrgHierarchyConfig = DEFAULT_ORG_CONFIG
): string {
  return config.levelNames[level] || level;
}

/**
 * Check if a level can have its own BSC
 */
export function canHaveBSC(
  level: OrgLevel,
  config: OrgHierarchyConfig = DEFAULT_ORG_CONFIG
): boolean {
  return config.levelsWithBSC.includes(level);
}

/**
 * Get all levels in hierarchical order
 */
export const ORG_LEVELS_ORDERED: OrgLevel[] = ['directorate', 'division', 'department', 'section'];

/**
 * Generate example org structure for demo/testing
 * Note: All org units now require a companyId
 */
export function generateExampleOrgStructure(companyId: string = 'company-default'): OrgUnit[] {
  const timestamp = getTimestamp();

  return [
    {
      id: 'org-dir-tech',
      name: 'Technology Directorate',
      code: 'TECH',
      level: 'directorate',
      parentId: null,
      companyId,
      description: 'Technology and IT operations',
      hasBSC: true,
      displayOrder: 1,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'org-dir-ops',
      name: 'Operations Directorate',
      code: 'OPS',
      level: 'directorate',
      parentId: null,
      companyId,
      description: 'Business operations and delivery',
      hasBSC: true,
      displayOrder: 2,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'org-div-engineering',
      name: 'Engineering Division',
      code: 'ENG',
      level: 'division',
      parentId: 'org-dir-tech',
      companyId,
      description: 'Software engineering teams',
      hasBSC: false,
      inheritBSCFromId: 'org-dir-tech',
      displayOrder: 1,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'org-div-infra',
      name: 'Infrastructure Division',
      code: 'INFRA',
      level: 'division',
      parentId: 'org-dir-tech',
      companyId,
      description: 'IT infrastructure and cloud',
      hasBSC: false,
      inheritBSCFromId: 'org-dir-tech',
      displayOrder: 2,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'org-dept-frontend',
      name: 'Frontend Development',
      code: 'FE',
      level: 'department',
      parentId: 'org-div-engineering',
      companyId,
      description: 'Web and mobile frontend teams',
      hasBSC: false,
      inheritBSCFromId: 'org-dir-tech',
      displayOrder: 1,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'org-dept-backend',
      name: 'Backend Development',
      code: 'BE',
      level: 'department',
      parentId: 'org-div-engineering',
      companyId,
      description: 'API and services teams',
      hasBSC: false,
      inheritBSCFromId: 'org-dir-tech',
      displayOrder: 2,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'org-section-react',
      name: 'React Team',
      code: 'REACT',
      level: 'section',
      parentId: 'org-dept-frontend',
      companyId,
      description: 'React development team',
      hasBSC: false, // Section cannot have BSC
      inheritBSCFromId: 'org-dir-tech',
      displayOrder: 1,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}
