import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { HealthRibbon } from '../portfolio/HealthRibbon';
import { InitiativeRoadmap } from '../portfolio/InitiativeRoadmap';
import { DataGrid } from '../portfolio/DataGrid';
import { Briefcase } from 'lucide-react';

export const PortfolioHub: React.FC = () => {
  const { state } = useApp();
  const { pillars, initiatives, projects, resources } = state;
  const [searchParams] = useSearchParams();

  // Filter by pillar if specified
  const pillarFilter = searchParams.get('pillar');
  const filteredInitiatives = pillarFilter
    ? initiatives.filter((i) => i.pillarId === pillarFilter)
    : initiatives;

  const filteredProjects = pillarFilter
    ? projects.filter((p) => {
        const initiative = initiatives.find((i) => i.id === p.initiativeId);
        return initiative?.pillarId === pillarFilter;
      })
    : projects;

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
          </h1>
          <p className="text-text-secondary mt-1">PMO View</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg border border-border">
          <Briefcase className="w-5 h-5 text-accent-purple" />
          <span className="text-sm text-text-secondary">PMO Persona</span>
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
