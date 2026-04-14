import { SubscriptionPlan } from '../enums/subscription.enum';

export interface PlanLimits {
  maxUsers: number; // -1 = unlimited
  maxProjects: number; // -1 = unlimited
  storageGb: number;
  features: string[];
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  [SubscriptionPlan.BASIC]: {
    maxUsers: 5,
    maxProjects: 3,
    storageGb: 5,
    features: ['projects', 'timeline', 'files', 'blog'],
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    maxUsers: 25,
    maxProjects: 20,
    storageGb: 50,
    features: ['projects', 'timeline', 'files', 'blog', 'financial', 'maintenance', 'coupons'],
  },
  [SubscriptionPlan.ENTERPRISE]: {
    maxUsers: -1,
    maxProjects: -1,
    storageGb: 500,
    features: [
      'projects',
      'timeline',
      'files',
      'blog',
      'financial',
      'maintenance',
      'coupons',
      'live_monitoring',
      'audit',
      'custom_domain',
    ],
  },
};

export const TRIAL_DAYS = 7;
export const MAX_FILE_SIZE_MB = 500;
export const PRESIGNED_URL_EXPIRES_SECONDS = 900; // 15 min
