import React from 'react';
import { Box, Typography, IconButton, Button, Chip, CircularProgress } from '@wso2/oxygen-ui';
import { ChevronRight, ChevronDown, Plus } from '@wso2/oxygen-ui-icons-react';
import type { PASNamespace, PASProject, PASComponent, SelectedItem } from '../../types/api';

interface ResourceTreeProps {
  org: PASNamespace | null;
  projects: PASProject[];
  componentsByProject: Record<string, PASComponent[]>;
  selectedItem: SelectedItem | null;
  expandedNodes: Set<string>;
  isLoading: (key: string) => boolean;
  onSelect: (item: SelectedItem) => void;
  onToggle: (nodeKey: string) => void;
  onCreateProject: () => void;
  onCreateComponent: (projectName: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  org: '#7c3aed',
  project: '#2563eb',
  component: '#16a34a',
};

const STATUS_COLOR_MAP: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  Ready: 'success',
  Active: 'success',
  Building: 'warning',
  Running: 'warning',
  Failed: 'error',
  Pending: 'info',
};

function isSelected(selectedItem: SelectedItem | null, item: SelectedItem): boolean {
  if (!selectedItem || selectedItem.type !== item.type) return false;
  if (selectedItem.type === 'org' && item.type === 'org') return true;
  if (selectedItem.type === 'project' && item.type === 'project')
    return selectedItem.projectName === item.projectName;
  if (selectedItem.type === 'component' && item.type === 'component')
    return selectedItem.projectName === item.projectName && selectedItem.componentName === item.componentName;
  return false;
}

interface TreeNodeProps {
  label: string;
  typeColor: string;
  level: number;
  selected: boolean;
  expandable: boolean;
  expanded: boolean;
  loading?: boolean;
  statusChip?: { label: string; color: 'success' | 'warning' | 'error' | 'info' };
  onClick: () => void;
  onToggle: () => void;
}

function TreeNode({ label, typeColor, level, selected, expandable, expanded, loading, statusChip, onClick, onToggle }: TreeNodeProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        pl: level * 2.5,
        pr: 1,
        py: 0.5,
        cursor: 'pointer',
        bgcolor: selected ? 'primary.lighter' : 'transparent',
        '&:hover': { bgcolor: selected ? 'primary.lighter' : 'action.hover' },
        borderRadius: 0.5,
        mx: 0.5,
        minHeight: 36,
      }}
      onClick={onClick}
    >
      {expandable ? (
        <IconButton
          size="small"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onToggle();
          }}
          sx={{ p: 0.25, mr: 0.5 }}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </IconButton>
      ) : (
        <Box sx={{ width: 28 }} />
      )}
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '2px',
          bgcolor: typeColor,
          mr: 1,
          flexShrink: 0,
        }}
      />
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          fontWeight: selected ? 600 : 400,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
      {loading && <CircularProgress size={14} sx={{ ml: 1 }} />}
      {statusChip && (
        <Chip label={statusChip.label} color={statusChip.color} size="small" sx={{ ml: 1, height: 20, fontSize: 11 }} />
      )}
    </Box>
  );
}

export default function ResourceTree({
  org,
  projects,
  componentsByProject,
  selectedItem,
  expandedNodes,
  isLoading,
  onSelect,
  onToggle,
  onCreateProject,
  onCreateComponent,
}: ResourceTreeProps) {
  if (!org) return null;

  const orgKey = `org:${org.name}`;
  const orgExpanded = expandedNodes.has(orgKey);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: 1, borderColor: 'divider' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Resources
        </Typography>
      </Box>

      {/* Tree */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {/* Org node */}
        <TreeNode
          label={org.displayName ?? org.name}
          typeColor={TYPE_COLORS.org}
          level={0}
          selected={isSelected(selectedItem, { type: 'org' })}
          expandable
          expanded={orgExpanded}
          onClick={() => onSelect({ type: 'org' })}
          onToggle={() => onToggle(orgKey)}
        />

        {/* Projects */}
        {orgExpanded && (
          <>
            {isLoading('projects') && (
              <Box sx={{ pl: 5, py: 1 }}>
                <CircularProgress size={16} />
              </Box>
            )}
            {projects.map((proj: PASProject) => {
              const projKey = `proj:${proj.name}`;
              const projExpanded = expandedNodes.has(projKey);
              const components = componentsByProject[proj.name] || [];
              const componentsLoading = isLoading(`components:${proj.name}`);

              return (
                <React.Fragment key={proj.name}>
                  <TreeNode
                    label={proj.displayName ?? proj.name}
                    typeColor={TYPE_COLORS.project}
                    level={1}
                    selected={isSelected(selectedItem, { type: 'project', projectName: proj.name })}
                    expandable
                    expanded={projExpanded}
                    loading={componentsLoading}
                    onClick={() => onSelect({ type: 'project', projectName: proj.name })}
                    onToggle={() => onToggle(projKey)}
                  />
                  {projExpanded &&
                    components.map((comp: PASComponent) => (
                      <TreeNode
                        key={comp.name}
                        label={comp.displayName ?? comp.name}
                        typeColor={TYPE_COLORS.component}
                        level={2}
                        selected={isSelected(selectedItem, {
                          type: 'component',
                          projectName: proj.name,
                          componentName: comp.name,
                        })}
                        expandable={false}
                        expanded={false}
                        statusChip={{
                          label: comp.status ?? 'Unknown',
                          color: STATUS_COLOR_MAP[comp.status ?? ''] ?? 'info',
                        }}
                        onClick={() =>
                          onSelect({
                            type: 'component',
                            projectName: proj.name,
                            componentName: comp.name,
                          })
                        }
                        onToggle={() => {}}
                      />
                    ))}
                </React.Fragment>
              );
            })}
          </>
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
        <Button
          size="small"
          startIcon={<Plus size={16} />}
          onClick={() => onCreateProject()}
        >
          Project
        </Button>
        <Button
          size="small"
          startIcon={<Plus size={16} />}
          onClick={() => {
            if (selectedItem?.type === 'component') {
              onCreateComponent(selectedItem.projectName);
            } else if (selectedItem?.type === 'project') {
              onCreateComponent(selectedItem.projectName);
            } else if (projects.length > 0) {
              onCreateComponent(projects[0].name);
            }
          }}
        >
          Component
        </Button>
      </Box>
    </Box>
  );
}
