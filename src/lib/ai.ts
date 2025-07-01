import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from './prisma';

interface LineComment {
  file: string;
  line: number;
  comment: string;
  suggestion?: string | unknown;
}

interface ParsedReview {
  overall_feedback: string;
  line_comments: LineComment[];
}

export interface CodeReview {
  overall_feedback: string;
  line_comments: Array<{
    file: string;
    line: number;
    comment: string;
    suggestion?: string;
  }>;
}

export interface CommentResponse {
  response: string;
}

export interface FileChange {
  filename: string;
  status: 'added' | 'modified' | 'removed';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  contents_url?: string;
}

export abstract class AIProvider {
  abstract generateCodeReview(files: FileChange[]): Promise<CodeReview>;
  abstract generateCommentResponse(
    originalComment: string,
    userComment: string,
    context?: {
      filename?: string;
      pullRequestUrl?: string;
      codeSnippet?: string;
    }
  ): Promise<CommentResponse>;
}

export class OpenAIProvider extends AIProvider {
  private openai: OpenAI;

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      organization: process.env.OPENAI_ORGANIZATION,
    });
  }

  async generateCodeReview(files: FileChange[]): Promise<CodeReview> {
    const filteredFiles = this.filterRelevantFiles(files);

    if (filteredFiles.length === 0) {
      return {
        overall_feedback: 'No reviewable code changes found.',
        line_comments: [],
      };
    }

    const prompt = this.buildPrompt(filteredFiles);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert code reviewer. Analyze the provided git diff and provide constructive feedback.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsedReview = this.parseAIResponse(content);
      return parsedReview;
    } catch (error) {
      throw new Error('Failed to generate code review with OpenAI');
    }
  }

  private filterRelevantFiles(files: FileChange[]): FileChange[] {
    const ignoredExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.ico',
      '.svg',
      '.woff',
      '.woff2',
      '.ttf',
      '.eot',
    ];
    const ignoredPaths = [
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      '.git/',
    ];

    return files.filter(file => {
      const hasIgnoredExtension = ignoredExtensions.some(ext =>
        file.filename.endsWith(ext)
      );
      const hasIgnoredPath = ignoredPaths.some(path =>
        file.filename.includes(path)
      );

      return !hasIgnoredExtension && !hasIgnoredPath && file.patch;
    });
  }

  private buildPrompt(files: FileChange[]): string {
    let prompt =
      'Please review the following code changes and provide brief, focused feedback. Keep comments concise and actionable:\n\n';

    files.forEach(file => {
      prompt += `## File: ${file.filename}\n`;
      prompt += `Status: ${file.status}\n`;
      prompt += `Changes: +${file.additions} -${file.deletions}\n\n`;
      if (file.patch) {
        prompt += '```diff\n' + file.patch + '\n```\n\n';
      }
    });

    prompt += `
Please provide your review in the following JSON format:
{
  "overall_feedback": "Brief, focused summary of key points and suggestions",
  "line_comments": [
    {
      "file": "filename",
      "line": 10,
      "comment": "Brief, specific feedback for this line",
      "suggestion": "Code suggestion if needed, otherwise empty string"
    }
  ]
}

IMPORTANT:
- Keep feedback brief and focused on important issues
- Only provide suggestions for significant improvements or bug fixes
- Each comment should be clear and actionable
- Suggestions must be valid, ready-to-commit code
`;

    return prompt;
  }

  private parseAIResponse(content: string): CodeReview {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsed = JSON.parse(jsonMatch[0]) as ParsedReview;
      if (parsed.line_comments && Array.isArray(parsed.line_comments)) {
        parsed.line_comments = parsed.line_comments.map(
          (comment: LineComment) => ({
            ...comment,
            suggestion:
              typeof comment.suggestion === 'string'
                ? comment.suggestion
                : String(comment.suggestion || ''),
          })
        );
      }
      return parsed as CodeReview;
    } catch {
      return {
        overall_feedback: content,
        line_comments: [],
      };
    }
  }

  async generateCommentResponse(
    originalComment: string,
    userComment: string,
    context?: {
      filename?: string;
      pullRequestUrl?: string;
      codeSnippet?: string;
    }
  ): Promise<CommentResponse> {
    const prompt = this.buildCommentResponsePrompt(
      originalComment,
      userComment,
      context
    );

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert code reviewer and assistant. Respond helpfully and professionally to follow-up questions or comments about your code review feedback. Keep responses concise but informative.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return { response: content };
    } catch (error) {
      throw new Error('Failed to generate comment response with OpenAI');
    }
  }

  private buildCommentResponsePrompt(
    originalComment: string,
    userComment: string,
    context?: {
      filename?: string;
      pullRequestUrl?: string;
      codeSnippet?: string;
    }
  ): string {
    let prompt = `I previously provided this code review feedback:\n\n"${originalComment}"\n\n`;
    prompt += `The developer has responded with:\n\n"${userComment}"\n\n`;

    if (context?.filename) {
      prompt += `Context: This is about the file ${context.filename}\n\n`;
    }

    if (context?.codeSnippet) {
      prompt += `Related code:\n\`\`\`\n${context.codeSnippet}\n\`\`\`\n\n`;
    }

    prompt += `Please provide a helpful response to the developer's comment. Be professional, constructive, and specific. If they're asking for clarification, provide it. If they're disagreeing, explain your reasoning. If they're asking for alternatives, suggest them.`;

    return prompt;
  }
}

export class ClaudeProvider extends AIProvider {
  private anthropic: Anthropic;

  constructor() {
    super();
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  async generateCodeReview(files: FileChange[]): Promise<CodeReview> {
    const filteredFiles = this.filterRelevantFiles(files);

    if (filteredFiles.length === 0) {
      return {
        overall_feedback: 'No reviewable code changes found.',
        line_comments: [],
      };
    }

    const prompt = this.buildPrompt(filteredFiles);

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text')
        throw new Error('Unexpected response type from Claude');

      return this.parseAIResponse(content.text);
    } catch (error) {
      throw new Error('Failed to generate code review with Claude');
    }
  }

  private filterRelevantFiles(files: FileChange[]): FileChange[] {
    const ignoredExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.ico',
      '.svg',
      '.woff',
      '.woff2',
      '.ttf',
      '.eot',
    ];
    const ignoredPaths = [
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      '.git/',
    ];

    return files.filter(file => {
      const hasIgnoredExtension = ignoredExtensions.some(ext =>
        file.filename.endsWith(ext)
      );
      const hasIgnoredPath = ignoredPaths.some(path =>
        file.filename.includes(path)
      );

      return !hasIgnoredExtension && !hasIgnoredPath && file.patch;
    });
  }

  private buildPrompt(files: FileChange[]): string {
    let prompt =
      'Please review the following code changes and provide brief, focused feedback. Keep comments concise and actionable:\n\n';

    files.forEach(file => {
      prompt += `## File: ${file.filename}\n`;
      prompt += `Status: ${file.status}\n`;
      prompt += `Changes: +${file.additions} -${file.deletions}\n\n`;
      if (file.patch) {
        prompt += '```diff\n' + file.patch + '\n```\n\n';
      }
    });

    prompt += `
Please provide your review in the following JSON format:
{
  "overall_feedback": "Brief, focused summary of key points and suggestions",
  "line_comments": [
    {
      "file": "filename",
      "line": 10,
      "comment": "Brief, specific feedback for this line",
      "suggestion": "Code suggestion if needed, otherwise empty string"
    }
  ]
}

IMPORTANT:
- Keep feedback brief and focused on important issues
- Only provide suggestions for significant improvements or bug fixes
- Each comment should be clear and actionable
- Suggestions must be valid, ready-to-commit code
`;

    return prompt;
  }

  private parseAIResponse(content: string): CodeReview {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsed = JSON.parse(jsonMatch[0]) as ParsedReview;
      if (parsed.line_comments && Array.isArray(parsed.line_comments)) {
        parsed.line_comments = parsed.line_comments.map(
          (comment: LineComment) => ({
            ...comment,
            suggestion:
              typeof comment.suggestion === 'string'
                ? comment.suggestion
                : String(comment.suggestion || ''),
          })
        );
      }
      return parsed as CodeReview;
    } catch {
      return {
        overall_feedback: content,
        line_comments: [],
      };
    }
  }

  async generateCommentResponse(
    originalComment: string,
    userComment: string,
    context?: {
      filename?: string;
      pullRequestUrl?: string;
      codeSnippet?: string;
    }
  ): Promise<CommentResponse> {
    const prompt = this.buildCommentResponsePrompt(
      originalComment,
      userComment,
      context
    );

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return { response: content.text };
    } catch (error) {
      throw new Error('Failed to generate comment response with Claude');
    }
  }

  private buildCommentResponsePrompt(
    originalComment: string,
    userComment: string,
    context?: {
      filename?: string;
      pullRequestUrl?: string;
      codeSnippet?: string;
    }
  ): string {
    let prompt = `I previously provided this code review feedback:\n\n"${originalComment}"\n\n`;
    prompt += `The developer has responded with:\n\n"${userComment}"\n\n`;

    if (context?.filename) {
      prompt += `Context: This is about the file ${context.filename}\n\n`;
    }

    if (context?.codeSnippet) {
      prompt += `Related code:\n\`\`\`\n${context.codeSnippet}\n\`\`\`\n\n`;
    }

    prompt += `Please provide a helpful response to the developer's comment. Be professional, constructive, and specific. If they're asking for clarification, provide it. If they're disagreeing, explain your reasoning. If they're asking for alternatives, suggest them. Keep the response concise but informative.`;

    return prompt;
  }
}

const TOKEN_LIMIT_PER_24H = process.env.TOKEN_LIMIT_PER_24H
  ? parseInt(process.env.TOKEN_LIMIT_PER_24H, 10)
  : 1_000_000;

if (isNaN(TOKEN_LIMIT_PER_24H)) {
  throw new Error('TOKEN_LIMIT_PER_24H must be a valid number if set');
}

export class AIService {
  private provider: AIProvider;

  constructor() {
    const aiProvider = process.env.AI_PROVIDER || 'openai';

    switch (aiProvider) {
      case 'claude':
        this.provider = new ClaudeProvider();
        break;
      case 'openai':
      default:
        this.provider = new OpenAIProvider();
        break;
    }
  }

  private async checkAndUpdateTokenUsage(
    organizationId: string,
    tokenCount: number
  ): Promise<boolean> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const totalTokens = await prisma.tokenUsage.aggregate({
      where: {
        organizationId,
        date: {
          gte: oneDayAgo,
        },
      },
      _sum: {
        tokenCount: true,
      },
    });

    const currentUsage = totalTokens._sum.tokenCount || 0;

    if (currentUsage + tokenCount > TOKEN_LIMIT_PER_24H) {
      return false;
    }

    await prisma.tokenUsage.create({
      data: {
        organizationId,
        tokenCount,
        date: new Date(),
      },
    });

    return true;
  }

  async generateCodeReview(
    files: FileChange[],
    organizationId: string
  ): Promise<CodeReview> {
    try {
      const estimatedTokens = files.reduce((total, file) => {
        return total + (file.patch?.length || 0) / 4;
      }, 1000);

      const canProceed = await this.checkAndUpdateTokenUsage(
        organizationId,
        Math.ceil(estimatedTokens)
      );
      if (!canProceed) {
        return {
          overall_feedback:
            'Unable to process review - organization has exceeded their token limit for the past 24 hours. Please try again later.',
          line_comments: [],
        };
      }

      const result = await this.provider.generateCodeReview(files);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async generateCommentResponse(
    originalComment: string,
    userComment: string,
    organizationId: string,
    context?: {
      filename?: string;
      pullRequestUrl?: string;
      codeSnippet?: string;
    }
  ): Promise<CommentResponse> {
    try {
      const estimatedTokens = Math.ceil(
        (originalComment.length +
          userComment.length +
          (context?.codeSnippet?.length || 0)) /
          4
      );

      const canProceed = await this.checkAndUpdateTokenUsage(
        organizationId,
        estimatedTokens
      );
      if (!canProceed) {
        return {
          response:
            'I apologize, but I cannot process this request as your organization has exceeded their token limit for the past 24 hours. Please try again later.',
        };
      }

      const result = await this.provider.generateCommentResponse(
        originalComment,
        userComment,
        context
      );
      return result;
    } catch (error) {
      throw error;
    }
  }
}
