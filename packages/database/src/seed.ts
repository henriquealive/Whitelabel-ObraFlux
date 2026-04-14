import { PrismaClient, Role, ProjectStatus, SubscriptionPlan, SubscriptionStatus, BillingInterval, BlogPostStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Tenants ─────────────────────────────────────────────────────────────────

  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'acme-arquitetura' },
    update: {},
    create: {
      name: 'Acme Arquitetura',
      slug: 'acme-arquitetura',
      isActive: true,
      branding: {
        create: {
          primaryColor: '#2563EB',
          secondaryColor: '#7C3AED',
          accentColor: '#10B981',
          backgroundColor: '#FFFFFF',
          fontFamily: 'Inter',
          borderRadius: '8px',
          companyName: 'Acme Arquitetura e Engenharia',
          tagline: 'Construindo o futuro, tijolo por tijolo.',
          supportEmail: 'suporte@acme.com',
        },
      },
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'construtech' },
    update: {},
    create: {
      name: 'ConstruTech',
      slug: 'construtech',
      isActive: true,
      branding: {
        create: {
          primaryColor: '#DC2626',
          secondaryColor: '#EA580C',
          accentColor: '#16A34A',
          backgroundColor: '#FAFAFA',
          fontFamily: 'Roboto',
          borderRadius: '4px',
          companyName: 'ConstruTech Soluções',
          tagline: 'Tecnologia aplicada à construção.',
          supportEmail: 'contato@construtech.com.br',
        },
      },
    },
  });

  // ── Subscriptions ────────────────────────────────────────────────────────────

  await prisma.subscription.upsert({
    where: { tenantId: tenant1.id },
    update: {},
    create: {
      tenantId: tenant1.id,
      plan: SubscriptionPlan.PROFESSIONAL,
      status: SubscriptionStatus.ACTIVE,
      billingInterval: BillingInterval.MONTHLY,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxUsers: 25,
      maxProjects: 20,
      storageGb: 50,
    },
  });

  await prisma.subscription.upsert({
    where: { tenantId: tenant2.id },
    update: {},
    create: {
      tenantId: tenant2.id,
      plan: SubscriptionPlan.BASIC,
      status: SubscriptionStatus.TRIALING,
      billingInterval: BillingInterval.MONTHLY,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxUsers: 5,
      maxProjects: 3,
      storageGb: 5,
    },
  });

  // ── Users ────────────────────────────────────────────────────────────────────

  const hashedPassword = await bcrypt.hash('Admin@123456', 12);

  const admin1 = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant1.id, email: 'admin@acme.com' } },
    update: {},
    create: {
      tenantId: tenant1.id,
      email: 'admin@acme.com',
      password: hashedPassword,
      name: 'Carlos Mendes',
      role: Role.ADMIN,
      isActive: true,
      isEmailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant1.id, email: 'pm@acme.com' } },
    update: {},
    create: {
      tenantId: tenant1.id,
      email: 'pm@acme.com',
      password: hashedPassword,
      name: 'Ana Paula',
      role: Role.PROJECT_MANAGER,
      isActive: true,
      isEmailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant1.id, email: 'cliente@acme.com' } },
    update: {},
    create: {
      tenantId: tenant1.id,
      email: 'cliente@acme.com',
      password: hashedPassword,
      name: 'Roberto Silva',
      role: Role.CLIENT,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant2.id, email: 'admin@construtech.com' } },
    update: {},
    create: {
      tenantId: tenant2.id,
      email: 'admin@construtech.com',
      password: hashedPassword,
      name: 'Fernanda Lima',
      role: Role.ADMIN,
      isActive: true,
      isEmailVerified: true,
    },
  });

  // ── Projects ─────────────────────────────────────────────────────────────────

  const project1 = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      tenantId: tenant1.id,
      name: 'Residencial Jardim Paulista',
      description: 'Construção de edifício residencial com 20 andares.',
      address: 'Rua Augusta, 500',
      city: 'São Paulo',
      state: 'SP',
      status: ProjectStatus.IN_PROGRESS,
      progressPct: 45,
      startDate: new Date('2024-03-01'),
      estimatedEnd: new Date('2025-12-31'),
      contractValue: 8500000,
      tags: ['residencial', 'alto-padrao'],
      members: {
        create: [
          { userId: admin1.id, role: Role.ADMIN },
        ],
      },
    },
  });

  await prisma.project.upsert({
    where: { id: 'seed-project-2' },
    update: {},
    create: {
      id: 'seed-project-2',
      tenantId: tenant1.id,
      name: 'Centro Empresarial Faria Lima',
      description: 'Reforma e modernização de lajes corporativas.',
      address: 'Av. Brigadeiro Faria Lima, 3000',
      city: 'São Paulo',
      state: 'SP',
      status: ProjectStatus.DRAFT,
      progressPct: 0,
      startDate: new Date('2025-02-01'),
      estimatedEnd: new Date('2025-08-31'),
      contractValue: 2300000,
      tags: ['comercial', 'reforma'],
      members: {
        create: [
          { userId: admin1.id, role: Role.ADMIN },
        ],
      },
    },
  });

  await prisma.project.upsert({
    where: { id: 'seed-project-3' },
    update: {},
    create: {
      id: 'seed-project-3',
      tenantId: tenant2.id,
      name: 'Galpão Industrial - Zona Norte',
      description: 'Construção de galpão logístico.',
      city: 'Guarulhos',
      state: 'SP',
      status: ProjectStatus.IN_PROGRESS,
      progressPct: 30,
      startDate: new Date('2024-06-01'),
      contractValue: 5100000,
      tags: ['industrial', 'logistica'],
      members: {
        create: [
          { userId: admin2.id, role: Role.ADMIN },
        ],
      },
    },
  });

  // ── Timeline Entries ──────────────────────────────────────────────────────────

  await prisma.timelineEntry.upsert({
    where: { id: 'seed-timeline-1' },
    update: {},
    create: {
      id: 'seed-timeline-1',
      tenantId: tenant1.id,
      projectId: project1.id,
      authorId: admin1.id,
      type: 'MILESTONE',
      title: 'Fundação concluída',
      content: 'Fundação do edifício concluída com sucesso. Todas as inspeções aprovadas.',
      isPinned: true,
      recordedAt: new Date('2024-06-15'),
    },
  });

  // ── Blog Posts ────────────────────────────────────────────────────────────────

  await prisma.blogPost.upsert({
    where: { tenantId_slug: { tenantId: tenant1.id, slug: 'tendencias-arquitetura-2025' } },
    update: {},
    create: {
      tenantId: tenant1.id,
      authorId: admin1.id,
      title: 'Tendências de Arquitetura para 2025',
      slug: 'tendencias-arquitetura-2025',
      excerpt: 'Descubra as principais tendências que moldarão a arquitetura e construção em 2025.',
      content: '<p>A arquitetura moderna está cada vez mais focada em sustentabilidade, tecnologia e bem-estar...</p>',
      status: BlogPostStatus.PUBLISHED,
      publishedAt: new Date('2025-01-10'),
      tags: ['tendencias', 'arquitetura', '2025'],
      readingTimeMins: 5,
      metaTitle: 'Tendências de Arquitetura 2025 | Acme Arquitetura',
      metaDescription: 'Conheça as principais tendências que vão transformar a arquitetura em 2025.',
    },
  });

  // ── Feature Flags ─────────────────────────────────────────────────────────────

  const flags = [
    { key: 'live_monitoring', isEnabled: true },
    { key: 'blog', isEnabled: true },
    { key: 'maintenance', isEnabled: true },
    { key: 'financial', isEnabled: true },
    { key: 'coupons', isEnabled: false },
    { key: 'audit', isEnabled: true },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { tenantId_key: { tenantId: tenant1.id, key: flag.key } },
      update: { isEnabled: flag.isEnabled },
      create: {
        tenantId: tenant1.id,
        key: flag.key,
        isEnabled: flag.isEnabled,
        rolloutPct: 100,
      },
    });
  }

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Tenant 1 (Acme Arquitetura):');
  console.log('  Admin:   admin@acme.com / Admin@123456');
  console.log('  PM:      pm@acme.com / Admin@123456');
  console.log('  Client:  cliente@acme.com / Admin@123456');
  console.log('');
  console.log('Tenant 2 (ConstruTech):');
  console.log('  Admin:   admin@construtech.com / Admin@123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
