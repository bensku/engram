import * as dotenv from 'dotenv';
dotenv.config({
  path: '../.env',
});

import { getExposedPort } from '../runner/runpod';
import { EmbedCluster, createEmbedder } from '../embed';
import { RunnerService } from '../runner';
import { wikipediaSource } from '../source/wikipedia';
import { clearQdrantCollection, qdrantSink } from '../sink/qdrant';

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

  const runners = await runnerSvc.createRunners(3);

  const failedRunners = await waitForRunners(runners);
  await runnerSvc.stopRunners(failedRunners);
  const usableRunners = runners.filter(
    (runner) => !failedRunners.includes(runner),
  );
  const embedCluster = new EmbedCluster(
    usableRunners.map((id) => getExposedPort(id, 8000)),
    embeddingsKey,
    50,
  );

  const source = wikipediaSource(sourceUrl, sourceDb, []);
  await clearQdrantCollection(targetUrl, targetDb);
  const sink = qdrantSink(targetUrl, targetDb);

  let chunks = [];
  for await (const chunk of source) {
    chunks.push(chunk);
    const start = Date.now();
    if (chunks.length == 5000) {
      // Create embeddings and throw them into sink
      const embeddings = await embedCluster.embed(
        chunks.map((chunk) => chunk.text),
      );
      await sink(chunks.map((chunk, i) => ({ chunk, values: embeddings[i] })));

      chunks = [];
      console.log(
        'Processed',
        chunks.length,
        'chunks in',
        (Date.now() - start) / 1000,
        'seconds',
      );
    }
  }

  await runnerSvc.stopAllRunners(); // Clean up after run
  process.exit(0);
})();

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
      } catch (e) {
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
