import { App, Octokit } from 'octokit';
import { prisma } from './prisma';
import { AIService, type FileChange, type CodeReview } from './ai';
import crypto from 'crypto';

export interface WebhookPayload {
  action?: string;
  installation?: {
    id: number;
    account: {
      login: string;
      html_url: string;
      avatar_url: string;
      bio?: string;
      type: string;
    };
  };
  repositories?: Array<{
    id: number;
    name: string;
    full_name: string;
    description?: string | null;
    html_url?: string;
    private: boolean;
  }>;
  repository?: {
    id: number;
    name: string;
    full_name: string;
    owner: { login: string };
  };
  pull_request?: {
    number: number;
    head: { sha: string };
    base: { sha: string };
  };
  comment?: {
    id: number;
    node_id: string;
    url: string;
    html_url: string;
    body: string;
    user: {
      login: string;
      id: number;
      type: string;
    };
    created_at: string;
    updated_at: string;
    author_association: string;
    path: string;
    position?: number;
    line?: number;
    commit_id: string;
    original_position?: number;
    original_line?: number;
    original_commit_id?: string;
    in_reply_to_id?: number;
  };
  commits?: Array<{
    id: string;
    message: string;
    author: { name: string; email: string };
  }>;
  sender?: {
    login: string;
  };
}

export class GitHubService {
  private app: App;

  constructor() {
    // Validate environment variables
    if (!process.env.GITHUB_APP_ID) {
      throw new Error('GITHUB_APP_ID environment variable is required');
    }
    if (!process.env.GITHUB_PRIVATE_KEY) {
      throw new Error('GITHUB_PRIVATE_KEY environment variable is required');
    }
    if (!process.env.GITHUB_WEBHOOK_SECRET) {
      throw new Error('GITHUB_WEBHOOK_SECRET environment variable is required');
    }

    try {
      this.app = new App({
        appId: process.env.GITHUB_APP_ID!,
        privateKey: process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        webhooks: {
          secret: process.env.GITHUB_WEBHOOK_SECRET!,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    try {
      const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET!;

      if (!signature || !signature.startsWith('sha256=')) {
        return false;
      }

      const trimmedSecret = webhookSecret.trim();

      // Use the raw payload for signature computation (Buffer if available, otherwise string)
      const hmac = crypto.createHmac('sha256', trimmedSecret);
      if (payload instanceof Buffer) {
        hmac.update(payload);
      } else {
        // TypeScript type narrowing: payload is string here
        hmac.update(payload as string, 'utf8');
      }
      const expectedSignature = hmac.digest('hex');

      const actualSignature = signature.replace('sha256=', '');

      // Ensure both signatures are valid hex strings of the same length
      if (expectedSignature.length !== actualSignature.length) {
        return false;
      }

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(actualSignature, 'hex')
      );

      return isValid;
    } catch (error) {
      return false;
    }
  }

  async processWebhook(
    payload: WebhookPayload,
    signature: string,
    eventType?: string
  ): Promise<{ status: string; message?: string }> {
    try {
      // Handle installation events
      if (eventType === 'installation') {
        switch (payload.action) {
          case 'created':
            if (payload.installation) {
              return this.handleInstallationCreated(payload);
            }
            break;
          case 'deleted':
            if (payload.installation) {
              return this.handleInstallationDeleted(payload);
            }
            break;
        }
      }

      // Handle installation_repositories events
      if (eventType === 'installation_repositories') {
        switch (payload.action) {
          case 'added':
            if (payload.repositories) {
              return this.handleRepositoriesAdded(payload);
            }
            break;
          case 'removed':
            if (payload.repositories) {
              return this.handleRepositoriesRemoved(payload);
            }
            break;
        }
      }

      // Handle pull request events
      if (eventType === 'pull_request') {
        switch (payload.action) {
          case 'opened':
          case 'synchronize':
            if (payload.pull_request) {
              return this.handlePullRequest(payload, payload.action);
            } else {
            }
            break;
        }
      }

      // Handle pull request review comment events
      if (eventType === 'pull_request_review_comment') {
        switch (payload.action) {
          case 'created':
            if (payload.comment && payload.repository) {
              return this.handlePullRequestReviewComment(payload);
            }
            break;
        }
        return {
          status: 'ignored',
          message: 'Only review comment creation events are processed',
        };
      }

      // Legacy fallback for events without eventType
      if (!eventType) {
        switch (payload.action) {
          case 'created':
            if (payload.installation) {
              return this.handleInstallationCreated(payload);
            }
            break;

          case 'deleted':
            if (payload.installation) {
              return this.handleInstallationDeleted(payload);
            }
            break;

          case 'opened':
          case 'synchronize':
            if (payload.pull_request) {
              return this.handlePullRequest(payload, payload.action);
            } else {
            }
            break;

          case 'added':
            if (payload.repositories) {
              return this.handleRepositoriesAdded(payload);
            }
            break;

          case 'removed':
            if (payload.repositories) {
              return this.handleRepositoriesRemoved(payload);
            }
            break;

          default:
            // Handle push events without action
            if (!payload.action && payload.repository && payload.commits) {
              return {
                status: 'ignored',
                message: 'Push event ignored (no PR to review)',
              };
            }
            break;
        }
      }

      return { status: 'ignored', message: 'Event not handled' };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleInstallationCreated(
    payload: WebhookPayload
  ): Promise<{ status: string }> {
    const installation = payload.installation!;
    const repositories = payload.repositories || [];
    const sender = payload.sender;

    // Safety check for installation.account
    if (!installation.account) {
      throw new Error(
        'Installation account data is required for installation creation'
      );
    }

    // Create or update organization
    const organization = await prisma.organization.upsert({
      where: { thirdPartyId: BigInt(installation.id) },
      update: {
        name: installation.account.login,
        url: installation.account.html_url,
        avatarUrl: installation.account.avatar_url,
        description: installation.account.bio || '',
      },
      create: {
        name: installation.account.login,
        description: installation.account.bio || '',
        organizationType:
          installation.account.type === 'User' ? 'USER' : 'TEAM',
        url: installation.account.html_url,
        avatarUrl: installation.account.avatar_url,
        thirdPartyId: BigInt(installation.id),
      },
    });

    if (sender) {
      try {
        let user = await prisma.user.findFirst({
          where: { githubUsername: sender.login },
        });

        if (!user) {
          const usersWithGithubAccounts = await prisma.user.findMany({
            where: {
              accounts: {
                some: {
                  provider: 'github',
                },
              },
            },
            include: {
              accounts: {
                where: { provider: 'github' },
              },
            },
          });

          for (const potentialUser of usersWithGithubAccounts) {
            const githubAccount = potentialUser.accounts[0];
            if (githubAccount && !potentialUser.githubUsername) {
              user = await prisma.user.update({
                where: { id: potentialUser.id },
                data: {
                  githubUsername: sender.login,
                },
              });
              break;
            }
          }
        }

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: sender.login,
              githubUsername: sender.login,
            },
          });
        }

        await prisma.organizationMember.upsert({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: organization.id,
            },
          },
          update: {
            role: 'admin', // The person who installs the app gets admin role
          },
          create: {
            userId: user.id,
            organizationId: organization.id,
            role: 'admin',
          },
        });
      } catch (userError) {
        // Continue processing even if user creation fails
      }
    }

    // Get installation access token to fetch all repositories if needed
    try {
      const octokit = await this.getInstallationOctokit(installation.id);

      // If no repositories in payload, fetch all accessible repositories
      let allRepositories = repositories;
      if (repositories.length === 0) {
        const { data: installationRepos } =
          await octokit.rest.apps.listReposAccessibleToInstallation();
        allRepositories = installationRepos.repositories.map(repo => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description || undefined,
          html_url: repo.html_url,
          private: repo.private,
        }));
      }

      // Create/update repositories
      for (const repo of allRepositories) {
        try {
          const repoUrl =
            repo.html_url || `https://github.com/${repo.full_name}`;

          await prisma.repository.upsert({
            where: { thirdPartyId: BigInt(repo.id) },
            update: {
              name: repo.name,
              fullName: repo.full_name,
              description: repo.description || '',
              url: repoUrl,
              private: repo.private,
              isEnabled: true, // Re-enable if it was previously disabled
            },
            create: {
              name: repo.name,
              fullName: repo.full_name,
              description: repo.description || '',
              url: repoUrl,
              private: repo.private,
              thirdPartyId: BigInt(repo.id),
              organizationId: organization.id,
              isEnabled: true,
            },
          });
        } catch (repoProcessError) {
          // Continue with other repositories instead of failing completely
        }
      }
    } catch (repoError) {
      // Still process the repositories from the payload if API call fails
      for (const repo of repositories) {
        const repoUrl = repo.html_url || `https://github.com/${repo.full_name}`;
        await prisma.repository.upsert({
          where: { thirdPartyId: BigInt(repo.id) },
          update: {
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description || '',
            url: repoUrl,
            private: repo.private,
            isEnabled: true,
          },
          create: {
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description || '',
            url: repoUrl,
            private: repo.private,
            thirdPartyId: BigInt(repo.id),
            organizationId: organization.id,
            isEnabled: true,
          },
        });
      }
    }

    return { status: 'installation_created' };
  }

  async handleInstallationDeleted(
    payload: WebhookPayload
  ): Promise<{ status: string }> {
    const installation = payload.installation!;

    await prisma.repository.updateMany({
      where: {
        organization: {
          thirdPartyId: BigInt(installation.id),
        },
      },
      data: {
        isEnabled: false,
      },
    });

    return { status: 'installation_deleted' };
  }

  async handleRepositoriesAdded(
    payload: WebhookPayload
  ): Promise<{ status: string }> {
    const installation = payload.installation!;
    const repositories = payload.repositories!;

    const organization = await prisma.organization.findUnique({
      where: { thirdPartyId: BigInt(installation.id) },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    for (const repo of repositories) {
      const repoUrl = repo.html_url || `https://github.com/${repo.full_name}`;
      await prisma.repository.upsert({
        where: { thirdPartyId: BigInt(repo.id) },
        update: {
          isEnabled: true,
        },
        create: {
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || '',
          url: repoUrl,
          private: repo.private,
          thirdPartyId: BigInt(repo.id),
          organizationId: organization.id,
          isEnabled: true,
        },
      });
    }

    return { status: 'repositories_added' };
  }

  async handleRepositoriesRemoved(
    payload: WebhookPayload
  ): Promise<{ status: string }> {
    const repositories = payload.repositories!;

    for (const repo of repositories) {
      await prisma.repository.updateMany({
        where: { thirdPartyId: BigInt(repo.id) },
        data: { isEnabled: false },
      });
    }

    return { status: 'repositories_removed' };
  }

  async handlePullRequest(
    payload: WebhookPayload,
    action?: string
  ): Promise<{ status: string; message?: string }> {
    const repository = await prisma.repository.findUnique({
      where: { thirdPartyId: BigInt(payload.repository!.id) },
      include: {
        organization: true,
      },
    });

    if (!repository || !repository.isEnabled) {
      return { status: 'skipped', message: 'Repository not found or disabled' };
    }

    // Check if private repo requires paid plan
    if (repository.private) {
      return {
        status: 'requires_upgrade',
        message: 'Private repository requires paid plan',
      };
    }

    // Get installation access token
    const octokit = await this.getInstallationOctokit(payload.installation!.id);

    const pullRequest = payload.pull_request!;
    const owner = payload.repository!.owner.login;
    const repo = payload.repository!.name;
    const currentAction = action || payload.action;

    try {
      // For synchronize events, get only the newly changed files
      let fileChanges: FileChange[];
      if (currentAction === 'synchronize') {
        fileChanges = await this.getNewCommitChanges(
          octokit,
          owner,
          repo,
          pullRequest.number,
          pullRequest.head.sha
        );

        if (fileChanges.length === 0) {
          return {
            status: 'skipped',
            message: 'No new changes to review in this commit',
          };
        }
      } else {
        // Get all pull request files for opened events
        const { data: files } = await octokit.rest.pulls.listFiles({
          owner,
          repo,
          pull_number: pullRequest.number,
        });

        // Convert to our FileChange format
        fileChanges = files.map(file => ({
          filename: file.filename,
          status: file.status as 'added' | 'modified' | 'removed',
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch,
          contents_url: file.contents_url,
        }));
      }

      // Generate AI review
      const aiService = new AIService();
      const review = await aiService.generateCodeReview(
        fileChanges,
        repository.organizationId
      );

      // Post review to GitHub
      await this.createPullRequestReview({
        octokit,
        owner,
        repo,
        pullNumber: pullRequest.number,
        commitSha: pullRequest.head.sha,
        review,
        isUpdateReview: currentAction === 'synchronize',
      });

      return { status: 'reviewed', message: 'AI review posted successfully' };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handlePullRequestReviewComment(
    payload: WebhookPayload
  ): Promise<{ status: string; message?: string }> {
    if (!payload.comment || !payload.repository || !payload.pull_request) {
      return { status: 'error', message: 'Missing required comment data' };
    }

    const comment = payload.comment;
    const repoPayload = payload.repository;
    const repository = await prisma.repository.findUnique({
      where: { thirdPartyId: BigInt(repoPayload.id) },
      select: {
        id: true,
        organizationId: true,
        isEnabled: true,
        name: true,
      },
    });

    if (!repository || !repository.isEnabled) {
      return { status: 'skipped', message: 'Repository not found or disabled' };
    }

    // Only process comments that are replies to other comments
    if (!comment.in_reply_to_id) {
      return {
        status: 'ignored',
        message: 'Only processing replies to comments',
      };
    }

    try {
      // Get installation access token
      const octokit = await this.getInstallationOctokit(
        payload.installation!.id
      );

      // Get the original comment being replied to
      const { data: originalComment } =
        await octokit.rest.pulls.getReviewComment({
          owner: repoPayload.owner.login,
          repo: repository.name,
          comment_id: comment.in_reply_to_id,
        });

      const isAIComment =
        originalComment.user.type === 'Bot' ||
        originalComment.author_association === 'COLLABORATOR' ||
        originalComment.body.includes('AI Code Review') ||
        originalComment.body.includes('AI generated');

      if (!isAIComment) {
        return {
          status: 'ignored',
          message: 'Original comment was not from AI bot',
        };
      }

      if (comment.user.type === 'Bot') {
        return { status: 'ignored', message: 'Reply is from bot itself' };
      }

      try {
        await octokit.rest.reactions.createForPullRequestReviewComment({
          owner: repoPayload.owner.login,
          repo: repository.name,
          comment_id: comment.id,
          content: 'eyes',
        });
      } catch (reactionError) {}

      let codeSnippet: string | undefined;
      try {
        const { data: fileContent } = await octokit.rest.repos.getContent({
          owner: repoPayload.owner.login,
          repo: repository.name,
          path: comment.path,
          ref: payload.pull_request.head.sha,
        });

        if ('content' in fileContent) {
          const decodedContent = Buffer.from(
            fileContent.content,
            'base64'
          ).toString('utf8');
          const lines = decodedContent.split('\n');
          const commentLine = comment.line || comment.original_line || 0;

          // Get context around the commented line (5 lines before and after)
          const startLine = Math.max(0, commentLine - 6);
          const endLine = Math.min(lines.length, commentLine + 5);
          codeSnippet = lines.slice(startLine, endLine).join('\n');
        }
      } catch (error) {
        // Continue without code snippet if we can't get file content
      }

      // Generate AI response
      const aiService = new AIService();
      const response = await aiService.generateCommentResponse(
        originalComment.body,
        comment.body,
        repository.organizationId,
        {
          filename: comment.path,
          pullRequestUrl: `https://github.com/${repoPayload.owner.login}/${repository.name}/pull/${payload.pull_request.number}`,
          codeSnippet,
        }
      );

      // Post the AI response as a reply to the user's comment
      await octokit.rest.pulls.createReplyForReviewComment({
        owner: repoPayload.owner.login,
        repo: repository.name,
        pull_number: payload.pull_request.number,
        comment_id: comment.id,
        body: response.response,
      });

      return {
        status: 'responded',
        message: 'AI response posted successfully',
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async getInstallationOctokit(
    installationId: number
  ): Promise<Octokit> {
    return await this.app.getInstallationOctokit(installationId);
  }

  private async getNewCommitChanges(
    octokit: Octokit,
    owner: string,
    repo: string,
    pullNumber: number,
    headSha: string
  ): Promise<FileChange[]> {
    try {
      // Get the list of commits in the PR
      const { data: commits } = await octokit.rest.pulls.listCommits({
        owner,
        repo,
        pull_number: pullNumber,
      });

      if (commits.length === 0) {
        return [];
      }

      // Find the latest commit (should match headSha)
      const latestCommit =
        commits.find(c => c.sha === headSha) || commits[commits.length - 1];

      // If this is the first commit, get all files
      if (commits.length === 1) {
        const { data: files } = await octokit.rest.pulls.listFiles({
          owner,
          repo,
          pull_number: pullNumber,
        });

        return files.map(file => ({
          filename: file.filename,
          status: file.status as 'added' | 'modified' | 'removed',
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch,
          contents_url: file.contents_url,
        }));
      }

      // Get the previous commit to compare against
      const commitIndex = commits.findIndex(c => c.sha === latestCommit.sha);
      const previousCommit =
        commitIndex > 0 ? commits[commitIndex - 1] : commits[0];

      // Get the diff between the previous commit and current commit
      const { data: comparison } = await octokit.rest.repos.compareCommits({
        owner,
        repo,
        base: previousCommit.sha,
        head: latestCommit.sha,
      });

      if (!comparison.files || comparison.files.length === 0) {
        return [];
      }

      // Convert to our FileChange format
      return comparison.files.map(file => ({
        filename: file.filename,
        status: file.status as 'added' | 'modified' | 'removed',
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        contents_url: file.contents_url,
      }));
    } catch (error) {
      // Fallback to getting all PR files if commit diff fails
      const { data: files } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
      });

      return files.map(file => ({
        filename: file.filename,
        status: file.status as 'added' | 'modified' | 'removed',
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        contents_url: file.contents_url,
      }));
    }
  }

  private async hasExistingAIReview(
    octokit: Octokit,
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<boolean> {
    try {
      // Get all reviews for this PR
      const { data: reviews } = await octokit.rest.pulls.listReviews({
        owner,
        repo,
        pull_number: pullNumber,
      });

      const aiReviews = reviews.filter(
        review =>
          review.body?.includes('AI Code Review') || review.user?.type === 'Bot'
      );

      return aiReviews.length > 0;
    } catch (error) {
      return false;
    }
  }

  private isLineInDiff(patch: string, lineNumber: number): boolean {
    try {
      if (!patch || !patch.trim()) {
        return false;
      }

      // Parse the patch to find which lines are actually part of the diff
      const lines = patch.split('\n');
      let currentLine = 0;
      let inHunk = false;

      for (const line of lines) {
        // Check for hunk header (e.g., @@ -1,4 +1,6 @@)
        const hunkMatch = line.match(
          /^@@\s*-(\d+)(?:,(\d+))?\s*\+(\d+)(?:,(\d+))?\s*@@/
        );
        if (hunkMatch) {
          currentLine = parseInt(hunkMatch[3], 10); // Start line in new file
          inHunk = true;
          continue;
        }

        if (!inHunk) continue;

        // Process diff lines
        if (line.startsWith('+')) {
          // Added line
          if (currentLine === lineNumber) {
            return true;
          }
          currentLine++;
        } else if (line.startsWith('-')) {
          // Deleted line - don't increment current line
          continue;
        } else if (line.startsWith(' ')) {
          // Context line
          if (currentLine === lineNumber) {
            return true;
          }
          currentLine++;
        } else if (line.startsWith('\\')) {
          // "No newline at end of file" - ignore
          continue;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Maps a diff-relative line number (as output by AI) to the absolute line number in the file.
   * Returns null if the mapping cannot be determined.
   */
  private getAbsoluteLineFromPatch(
    patch: string,
    diffLine: number
  ): number | null {
    if (!patch || !patch.trim()) return null;
    const lines = patch.split('\n');
    let currentFileLine = 0;
    let currentDiffLine = 0;
    let inHunk = false;
    for (const line of lines) {
      // Hunk header: @@ -a,b +c,d @@
      const hunkMatch = line.match(
        /^@@\s*-(\d+)(?:,(\d+))?\s*\+(\d+)(?:,(\d+))?\s*@@/
      );
      if (hunkMatch) {
        currentFileLine = parseInt(hunkMatch[3], 10) - 1; // 0-based
        currentDiffLine = 0;
        inHunk = true;
        continue;
      }
      if (!inHunk) continue;
      // Only count lines that would appear in the new file
      if (line.startsWith('+')) {
        currentFileLine++;
        currentDiffLine++;
      } else if (line.startsWith('-')) {
        // Removed line, does not increment file line
        currentDiffLine++;
      } else if (line.startsWith(' ')) {
        currentFileLine++;
        currentDiffLine++;
      } else if (line.startsWith('\\')) {
        // No newline at end of file
        continue;
      }
      // If we've reached the requested diff line, return the current file line
      if (currentDiffLine === diffLine) {
        return currentFileLine;
      }
    }
    return null;
  }

  private async createPullRequestReview({
    octokit,
    owner,
    repo,
    pullNumber,
    commitSha,
    review,
    isUpdateReview = false,
  }: {
    octokit: Octokit;
    owner: string;
    repo: string;
    pullNumber: number;
    commitSha: string;
    review: CodeReview;
    isUpdateReview?: boolean;
  }): Promise<void> {
    // Get the current file changes to validate line comments
    const { data: prFiles } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
    });

    // Validate and filter line comments to ensure they're part of the diff
    const validatedComments = review.line_comments
      .map(comment => {
        const file = prFiles.find(f => f.filename === comment.file);
        if (!file) {
          return null;
        }
        if (!file.patch) {
          return null;
        }
        // Map the AI's diff-relative line number to the absolute file line number
        const absoluteLine = this.getAbsoluteLineFromPatch(
          file.patch,
          comment.line
        );
        if (absoluteLine === null) {
          return null;
        }
        // Check if the mapped line is part of the diff
        const isValidLine = this.isLineInDiff(file.patch, absoluteLine);
        if (!isValidLine) {
          return null;
        }
        return {
          path: comment.file,
          line: absoluteLine,
          side: 'RIGHT',
          body: comment.suggestion
            ? `${comment.comment}\n\n\`\`\`suggestion\n${comment.suggestion}\n\`\`\``
            : comment.comment,
        };
      })
      .filter(
        (comment): comment is NonNullable<typeof comment> => comment !== null
      );

    // Build review body
    let reviewBody = review.overall_feedback;

    if (isUpdateReview) {
      reviewBody += `\n\n> 📝 **Note:** This review covers the latest changes in this commit.`;
    }

    // Always treat it as a comment since we removed the approval logic
    const reviewData = {
      owner,
      repo,
      pull_number: pullNumber,
      commit_id: commitSha,
      body: reviewBody,
      event: 'COMMENT' as const,
      comments: validatedComments.length > 0 ? validatedComments : undefined,
    };

    try {
      await octokit.rest.pulls.createReview(reviewData);
    } catch (apiError) {
      throw apiError;
    }
  }
}
