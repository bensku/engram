import * as dotenv from 'dotenv';
dotenv.config({
  path: '../.env',
});

import { getExposedPort } from '../runner/runpod';
import { EmbedCluster, createEmbedder } from '../embed';
import { RunnerService } from '../runner';
import { wikipediaSource } from '../source/wikipedia';
import { clearQdrantCollection, qdrantSink } from '../sink/qdrant';
import Bot from 'nodemw';
import { promisify } from 'util';
import { TextChunk } from '../source/api';

const runpodKey = process.env.RUNPOD_API_KEY;
const runpodRegistryAuth = process.env.RUNPOD_REGISTRY_AUTH_ID;
const embeddingTemplate = process.env.RUNPOD_EMBEDDING_TEMPLATE;
const embeddingsKey = process.env.BATCH_EMBEDDINGS_KEY;

if (!(runpodKey && runpodRegistryAuth && embeddingTemplate && embeddingsKey)) {
  throw new Error('missing values in .env');
}

const sourceUrl = process.argv[2];
const sourceDb = process.argv[3];
const targetUrl = process.argv[4];
const targetDb = process.argv[5];

const runnerSvc = new RunnerService(
  'batchEmbed',
  runpodKey,
  embeddingTemplate,
  [
    'NVIDIA GeForce RTX 3080 Ti',
    'NVIDIA GeForce RTX 3080',
    'NVIDIA GeForce RTX 3070',
  ],
);

void (async () => {
  await runnerSvc.stopAllRunners(); // Stop leftover runners if there were any
  if (sourceUrl == 'stop') {
    process.exit(0);
  }

  const includePages = await getCategoryMembers(
    'Wikipedia level-5 vital articles',
    true,
  );

  const runners = await runnerSvc.createRunners(12);

  const failedRunners = await waitForRunners(runners);
  await runnerSvc.stopRunners(failedRunners);
  const usableRunners = runners.filter(
    (runner) => !failedRunners.includes(runner),
  );
  const embedCluster = new EmbedCluster(
    usableRunners.map((id) => getExposedPort(id, 8000)),
    embeddingsKey,
    40,
  );

  const source = wikipediaSource(sourceUrl, sourceDb, { pages: includePages });
  await clearQdrantCollection(targetUrl, targetDb);
  const sink = qdrantSink(targetUrl, targetDb);

  let chunks: TextChunk[] = [];
  for await (const chunk of source) {
    chunks.push(chunk);

    if (chunks.length == 1000) {
      const embeddings = await embedChunks(embedCluster, chunks);
      void sink(embeddings); // Embed in background
      chunks = [];
    }
  }
  if (chunks.length > 0) {
    // Last <= 5000 chunks
    const embeddings = await embedChunks(embedCluster, chunks);
    await sink(embeddings);
  }

  await runnerSvc.stopAllRunners(); // Clean up after run
  process.exit(0);
})();

async function embedChunks(embedCluster: EmbedCluster, chunks: TextChunk[]) {
  const start = Date.now();
  // Create embeddings and throw them into sink
  const embeddings = await embedCluster.embed(
    chunks.map((chunk) => chunk.text),
  );
  const totalTime = Date.now() - start;
  console.log(
    `Processed ${chunks.length} chunks in ${totalTime / 1000}s (page index ${
      chunks[chunks.length - 1].docIndex ?? 'unknown'
    })`,
  );
  return chunks.map((chunk, i) => ({ chunk, values: embeddings[i] }));
}

const MAX_START_TIME = 300;
const TEST_INTERVAL = 5;

async function waitForRunners(ids: string[]) {
  const pass: Set<string> = new Set();
  for (let i = 0; i < MAX_START_TIME / TEST_INTERVAL; i++) {
    await new Promise((res) => setTimeout(res, TEST_INTERVAL * 1000));

    for (const id of ids) {
      if (pass.has(id)) {
        continue; // Already working
      }
      try {
        await createEmbedder(
          getExposedPort(id, 8000),
          embeddingsKey ?? '',
        )('this is a test');
        pass.add(id);
      } catch (_e) {
        // Do nothing, probably still starting up...
      }
    }
    if (pass.size == ids.length) {
      console.log('All runners up!');
      return [];
    }
    console.log(
      'Waiting for runners to start,',
      `${pass.size}/${ids.length}`,
      'ready',
    );
  }
  // Return problematic ids
  console.log('Some runners failed to start, ignoring them...');
  return ids.filter((id) => !pass.has(id));
}

async function getCategoryMembers(
  category: string,
  convertTalkPages: boolean,
): Promise<string[]> {
  const client = new Bot({
    server: 'en.wikipedia.org',
    path: '/w',
  });

  const getPagesInCategory = promisify(client.getPagesInCategory.bind(client));
  const members = await getPagesInCategory(category);
  return (
    members
      // Get pages of talk pages (if enabled); this is used for e.g. vital article categories
      ?.map((page) =>
        convertTalkPages ? page.title.replace('Talk:', '') : page.title,
      )
      // Remove non-wiki pages
      .filter(
        (page) =>
          !page.includes('User:') &&
          !page.includes('Wikipedia:') &&
          !page.includes('Category:'),
      )
      // Ids are actually not always page names
      // https://github.com/spencermountain/dumpster-dive/blob/master/src/worker/_encode.js
      .map((page) =>
        page
          .replace(/\\/g, '\\\\')
          .replace(/^\$/, '\\u0024')
          .replace(/\./g, '\\u002e'),
      ) ?? []
  );
}
