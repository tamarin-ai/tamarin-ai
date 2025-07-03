import type {
  Repository,
  Organization,
  User,
  OrganizationMember,
} from '../generated/prisma';

export type RepositoryWithOrganization = Repository & {
  organization: Organization & {
    members: Pick<OrganizationMember, 'role'>[];
  };
};

export type OrganizationWithDetails = Organization & {
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
    organization: Organization;
  })[];
};
