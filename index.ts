import dotenv from 'dotenv';
import path from 'path';

// Load .env.local first, then fallback to .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

import { config, higgsfield } from '@higgsfield/client/v2';

async function main() {
  const credentials = process.env.HF_CREDENTIALS || process.env.HF_KEY;

  if (!credentials || !credentials.includes(':')) {
    console.error('Error: HF_CREDENTIALS is not set or is not in the format "key-id:key-secret".');
    console.error('Please configure HF_CREDENTIALS in .env.local with your valid credentials from console.higgsfield.ai.');
    process.exit(1);
  }

  // Configure credentials without exposing them in logs
  config({
    credentials,
  });

  console.log('Submitting video generation request to model: bytedance/seedance-2.5/text-to-video');
  console.log('Parameters: prompt="A cinematic scene at sunset", duration=5, resolution=720p, aspect_ratio=16:9');

  try {
    const result: any = await higgsfield.subscribe(
      'bytedance/seedance-2.5/text-to-video',
      {
        input: {
          prompt: 'A cinematic scene at sunset',
          duration: 5,
          resolution: '720p',
          aspect_ratio: '16:9',
        },
        withPolling: true,
      }
    );

    console.log(`Request ID: ${result.request_id || 'N/A'}`);
    console.log(`Status: ${result.status}`);

    if (result.status === 'completed') {
      const videoUrl =
        result.video?.url ||
        result.output_url ||
        result.outputs?.[0]?.url ||
        result.jobs?.[0]?.results?.raw?.url;

      if (videoUrl) {
        console.log('Generation completed successfully!');
        console.log('Generated Video URL:', videoUrl);
      } else {
        console.error('Generation reported completed, but no media URL was found in the response payload.');
        console.error('Payload keys:', Object.keys(result));
        process.exit(1);
      }
    } else if (result.status === 'failed') {
      console.error('Generation failed on Higgsfield provider.');
      if (result.error) {
        console.error('Provider error message:', result.error);
      }
      process.exit(1);
    } else if (result.status === 'nsfw') {
      console.error('Generation was rejected by content moderation / safety policy (NSFW).');
      process.exit(1);
    } else if (result.status === 'canceled') {
      console.error('Generation request was canceled before completion.');
      process.exit(1);
    } else {
      console.error(`Generation finished with unexpected status: ${result.status}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('API execution error:', error?.message || error);
    process.exit(1);
  }
}

main();
