import { ProjectStatus } from '../enums/project-status.enum';
import { Role } from '../enums/roles.enum';

export interface ProjectSummary {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  status: ProjectStatus;
  progressPct: number;
  startDate?: Date | null;
  estimatedEnd?: Date | null;
  actualEnd?: Date | null;
  contractValue?: number | null;
  coverImageUrl?: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMemberSummary {
  id: string;
  userId: string;
  projectId: string;
  role: Role;
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface ProjectStats {
  totalProjects: number;
  byStatus: Record<ProjectStatus, number>;
  totalContractValue: number;
  avgProgress: number;
}
