export const FEATURE_FLAGS = {
  LIVE_MONITORING: 'live_monitoring',
  BLOG: 'blog',
  MAINTENANCE: 'maintenance',
  FINANCIAL: 'financial',
  COUPONS: 'coupons',
  AUDIT: 'audit',
  CUSTOM_DOMAIN: 'custom_domain',
  WHITE_LABEL: 'white_label',
  TWO_FACTOR_REQUIRED: 'two_factor_required',
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];
