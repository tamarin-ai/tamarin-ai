import { NextApiRequest, NextApiResponse } from 'next';
import { GitHubService } from '@/lib/github';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      console.log('📦 Raw body debug:', {
        totalChunks: chunks.length,
        totalBytes: buffer.length,
        firstChunkLength: chunks[0]?.length || 0,
        bufferStart: buffer.toString('utf8', 0, Math.min(50, buffer.length)),
        bufferEnd:
          buffer.length > 50
            ? buffer.toString('utf8', Math.max(0, buffer.length - 50))
            : '',
      });
      resolve(buffer);
    });

    req.on('error', err => {
      console.error('💥 Error reading raw body:', err);
      reject(err);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-hub-signature-256'] as string;
  const githubEvent = req.headers['x-github-event'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  try {
    const rawBodyBuffer = await getRawBody(req);
    const rawBody = rawBodyBuffer.toString('utf8');

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    const githubService = new GitHubService();

    if (!githubService.verifyWebhookSignature(rawBodyBuffer, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const result = await githubService.processWebhook(
      parsedBody,
      signature,
      githubEvent
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
