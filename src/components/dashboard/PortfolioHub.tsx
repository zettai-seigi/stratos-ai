import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useOrgContext } from '../../context/OrgContext';
import { HealthRibbon } from '../portfolio/HealthRibbon';
import { InitiativeRoadmap } from '../portfolio/InitiativeRoadmap';
import { DataGrid } from '../portfolio/DataGrid';
import { Briefcase, Building2 } from 'lucide-react';

export const PortfolioHub: React.FC = () => {
  const { state, getOrgUnit, getOrgUnitDescendants, getOrgConfig } = useApp();
  const { selectedOrgUnitId, isFiltering } = useOrgContext();
  const { pillars, resources } = state;
  const [searchParams] = useSearchParams();

  const config = getOrgConfig();
  const selectedUnit = selectedOrgUnitId ? getOrgUnit(selectedOrgUnitId) : null;

  // Filter by org unit first (including descendants)
  const { orgFilteredInitiatives, orgFilteredProjects } = useMemo(() => {
    if (!isFiltering) {
      return {
        orgFilteredInitiatives: state.initiatives,
        orgFilteredProjects: state.projects,
      };
    }

    const orgIds = new Set([selectedOrgUnitId!]);
    getOrgUnitDescendants(selectedOrgUnitId!).forEach((u) => orgIds.add(u.id));

    return {
      orgFilteredInitiatives: state.initiatives.filter((i) =>
        orgIds.has(i.orgUnitId || 'org-company')
      ),
      orgFilteredProjects: state.projects.filter((p) =>
        orgIds.has(p.orgUnitId || 'org-company')
      ),
    };
  }, [state.initiatives, state.projects, selectedOrgUnitId, isFiltering, getOrgUnitDescendants]);

  // Filter by pillar if specified
  const pillarFilter = searchParams.get('pillar');
  const statusFilter = searchParams.get('filter');

  // Apply pillar filter
  let filteredInitiatives = pillarFilter
    ? orgFilteredInitiatives.filter((i) => i.pillarId === pillarFilter)
    : orgFilteredInitiatives;

  // Apply status filter (at-risk = red or amber)
  if (statusFilter === 'at-risk') {
    filteredInitiatives = filteredInitiatives.filter(
      (i) => i.ragStatus === 'red' || i.ragStatus === 'amber'
    );
  }

  let filteredProjects = pillarFilter
    ? orgFilteredProjects.filter((p) => {
        const initiative = orgFilteredInitiatives.find((i) => i.id === p.initiativeId);
        return initiative?.pillarId === pillarFilter;
      })
    : orgFilteredProjects;

  // Filter projects by at-risk initiatives
  if (statusFilter === 'at-risk') {
    const atRiskInitiativeIds = filteredInitiatives.map((i) => i.id);
    filteredProjects = filteredProjects.filter(
      (p) => atRiskInitiativeIds.includes(p.initiativeId) || p.ragStatus === 'red' || p.ragStatus === 'amber'
    );
  }

  // Filter to only show projects at risk (red status)
  if (statusFilter === 'projects-at-risk') {
    filteredProjects = filteredProjects.filter((p) => p.ragStatus === 'red');
    // Also filter initiatives to only those that have red projects
    const initiativeIdsWithRedProjects = [...new Set(filteredProjects.map((p) => p.initiativeId))];
    filteredInitiatives = filteredInitiatives.filter((i) => initiativeIdsWithRedProjects.includes(i.id));
  }

  const filteredPillar = pillarFilter
    ? pillars.find((p) => p.id === pillarFilter)
    : null;

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Portfolio Oversight Hub
            {filteredPillar && (
              <span className="text-text-secondary font-normal">
                {' '}
                - {filteredPillar.name}
              </span>
            )}
            {statusFilter === 'at-risk' && (
              <span className="text-rag-amber font-normal">
                {' '}
                - At Risk Initiatives
              </span>
            )}
            {statusFilter === 'projects-at-risk' && (
              <span className="text-rag-red font-normal">
                {' '}
                - Projects at Risk
              </span>
            )}
          </h1>
          <p className="text-text-secondary mt-1">
            {isFiltering && selectedUnit
              ? `Viewing: ${selectedUnit.name} (${config.levelNames[selectedUnit.level]})`
              : 'PMO View'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg border border-border">
          {isFiltering && selectedUnit ? (
            <>
              <Building2 className="w-5 h-5 text-accent-purple" />
              <span className="text-sm text-text-secondary">{selectedUnit.name}</span>
            </>
          ) : (
            <>
              <Briefcase className="w-5 h-5 text-accent-purple" />
              <span className="text-sm text-text-secondary">All Organizations</span>
            </>
          )}
        </div>
      </div>

      {/* Health Ribbon */}
      <HealthRibbon initiatives={filteredInitiatives} projects={filteredProjects} />

      {/* Initiative Roadmap */}
      <InitiativeRoadmap initiatives={filteredInitiatives} pillars={pillars} />

      {/* Data Grid */}
      <DataGrid
        initiatives={filteredInitiatives}
        projects={filteredProjects}
        pillars={pillars}
        resources={resources}
      />
    </div>
  );
};
