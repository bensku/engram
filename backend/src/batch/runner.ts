import * as dotenv from 'dotenv';
dotenv.config({
  path: '../.env',
});

import { runner } from '../db/schema';
import { db } from '../db/core';
import { eq } from 'drizzle-orm';
import { createPod, destroyPod, getExposedPort, getGpuTypes } from './runpod';
import { createEmbedder } from './embed';

const runpodKey = process.env.RUNPOD_API_KEY;
const runpodRegistryAuth = process.env.RUNPOD_REGISTRY_AUTH_ID;
const embeddingTemplate = process.env.RUNPOD_EMBEDDING_TEMPLATE;
const embeddingsKey = process.env.BATCH_EMBEDDINGS_KEY;

if (!(runpodKey && runpodRegistryAuth && embeddingTemplate && embeddingsKey)) {
  throw new Error('missing values in .env');
}

// Get list of existing runners
void (async () => {
  // console.log(await getGpuTypes(runpodKey));
  await stopAllRunners(); // Stop any leftovers from previous runs
  const runners = await createRunners(10, [
    'NVIDIA GeForce RTX 3080 Ti',
    'NVIDIA GeForce RTX 3080',
    'NVIDIA GeForce RTX 3070',
  ]);
  const failedRunners = await waitForRunners(runners);
  await stopRunners(failedRunners);

  const usableRunners = await db.query.runner.findMany({
    where: eq(runner.type, 'batchEmbed'),
  });
  // TODO do something with the runners!

  await stopAllRunners(); // Clean up after run
  process.exit(0);
})();

async function stopAllRunners() {
  const runners = await db.query.runner.findMany({
    where: eq(runner.type, 'batchEmbed'),
  });
  await stopRunners(runners.map((runner) => runner.id));
}

async function stopRunners(runners: string[]) {
  console.log('Stopping', runners.length, 'runners...');
  await Promise.all(
    runners.map(async (id) => {
      await destroyPod(runpodKey ?? '', id);
      await db.delete(runner).where(eq(runner.id, id));
    }),
  );
  console.log('Runners stopped!');
}

async function createRunners(
  count: number,
  gpuChoices: string[],
): Promise<string[]> {
  console.log('Creating', count, 'runners');
  const podIds = [];
  let gpuIndex = 0;
  for (let i = 0; i < count; i++) {
    let id: string;
    try {
      id = await createPod(
        runpodKey ?? '',
        embeddingTemplate ?? '',
        gpuChoices[gpuIndex],
      );
      console.log('Started instance with ', gpuChoices[gpuIndex]);
    } catch (e) {
      i--;
      gpuIndex++;
      if (gpuIndex == gpuChoices.length) {
        throw new Error('runpod ran out of acceptable GPUs');
      }
      console.log('Out of GPUs, trying', gpuChoices[gpuIndex], 'next');
      continue;
    }
    await db.insert(runner).values({ id: id, type: 'batchEmbed' });
    podIds.push(id);
  }
  console.log('Runners created');
  return podIds;
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
