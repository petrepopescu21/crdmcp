import { CRDMetadata } from '../types/index.js';

export function generateResourceKey(group: string, kind: string): string {
  return `${group}/${kind}`;
}

export function parseResourceKey(key: string): { group: string; kind: string } {
  const [group, kind] = key.split('/');
  return { group, kind };
}

export function inferResourceCategory(
  crd: CRDMetadata | string
): string | undefined {
  const kind = typeof crd === 'string' ? crd : crd.kind;
  const lowerKind = kind.toLowerCase();

  // Database patterns
  if (
    lowerKind.includes('redis') ||
    lowerKind.includes('postgres') ||
    lowerKind.includes('mysql') ||
    lowerKind.includes('mongodb') ||
    lowerKind.includes('database') ||
    lowerKind.includes('db')
  ) {
    return 'database';
  }

  // Queue/messaging patterns
  if (
    lowerKind.includes('kafka') ||
    lowerKind.includes('rabbit') ||
    lowerKind.includes('queue') ||
    lowerKind.includes('topic') ||
    lowerKind.includes('stream')
  ) {
    return 'messaging';
  }

  // Service patterns
  if (
    lowerKind.includes('service') ||
    lowerKind.includes('api') ||
    lowerKind.includes('gateway') ||
    lowerKind.includes('proxy')
  ) {
    return 'service';
  }

  // Storage patterns
  if (
    lowerKind.includes('storage') ||
    lowerKind.includes('volume') ||
    lowerKind.includes('bucket')
  ) {
    return 'storage';
  }

  // Network patterns
  if (
    lowerKind.includes('network') ||
    lowerKind.includes('ingress') ||
    lowerKind.includes('route')
  ) {
    return 'networking';
  }

  // Security patterns
  if (
    lowerKind.includes('policy') ||
    lowerKind.includes('rbac') ||
    lowerKind.includes('auth') ||
    lowerKind.includes('cert')
  ) {
    return 'security';
  }

  return undefined;
}

export function extractTagsFromContent(content: string): string[] {
  const tags: Set<string> = new Set();

  // Extract common Kubernetes patterns
  const patterns = [
    /namespace:\s*(\w+)/gi,
    /app:\s*(\w+)/gi,
    /component:\s*(\w+)/gi,
    /tier:\s*(\w+)/gi,
    /version:\s*(\w+)/gi,
    /environment:\s*(\w+)/gi,
  ];

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1] !== 'default') {
        tags.add(match[1].toLowerCase());
      }
    }
  }

  return Array.from(tags);
}

export function generateDescription(
  fileName: string,
  content?: string
): string {
  // Generate description from filename
  const baseName = fileName.replace(/\.(ya?ml|md|txt)$/i, '');
  const words = baseName
    .split(/[-_\s]+/)
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

  let description = words.join(' ');

  // Enhance with content analysis if available
  if (content) {
    const lines = content.split('\n').slice(0, 5); // First 5 lines
    const commentLine = lines.find((line) => line.trim().match(/^#\s*(.+)/));
    if (commentLine) {
      const comment = commentLine.trim().replace(/^#\s*/, '');
      if (comment.length > description.length && comment.length < 100) {
        description = comment;
      }
    }
  }

  return description;
}

export function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}
