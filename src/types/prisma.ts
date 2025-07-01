import type {
  Repository,
  Organization,
  Pricing,
  User,
  OrganizationMember,
} from '../generated/prisma';

export type RepositoryWithOrganization = Repository & {
  organization: Organization & {
    pricing: Pricing | null;
    members: Pick<OrganizationMember, 'role'>[];
  };
};

export type OrganizationWithDetails = Organization & {
  pricing: Pricing | null;
  repositories: Repository[];
  members: (OrganizationMember & {
    user: Pick<User, 'id' | 'name' | 'email' | 'image' | 'githubUsername'>;
  })[];
  _count: {
    repositories: number;
    members: number;
  };
};

export type UserWithOrganizations = User & {
  organizations: (OrganizationMember & {
    organization: Organization & {
      pricing: Pricing | null;
    };
  })[];
};
