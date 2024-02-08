import * as dotenv from 'dotenv';
dotenv.config({
  path: '../.env',
});

import { getExposedPort } from '../runner/runpod';
import { EmbedCluster, createEmbedder } from '../embed';
import { RunnerService } from '../runner';
import { Document, MongoClient } from 'mongodb';
import { QdrantClient } from '@qdrant/js-client-rest';

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
  const source = new MongoClient(sourceUrl).db(sourceDb).collection('pages');
  const qdrant = new QdrantClient({ url: targetUrl });

  const runners = await runnerSvc.createRunners(3);

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

  let docs = [];
  for await (const doc of source.find({})) {
    docs.push(doc);
    const start = Date.now();
    if (docs.length == 200) {
      const chunks = docs.flatMap(pageToChunks);
      const embeddings = await embedCluster.embed(
        chunks.map((chunk) => chunk.text),
      );
      await qdrant.upsert(targetDb, {
        points: chunks.map((chunk, i) => ({
          id: i, // TODO how to get correct id?
          vector: embeddings[i],
        })),
      });

      docs = [];
      console.log(
        'Processed 1000 pages',
        'and',
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

interface Paragraph {
  sentences: { text: string }[];
}
interface Section {
  title: string;
  paragraphs: Paragraph[];
}

const CHUNK_MAX_WORDS = 350;

interface TextChunk {
  page: string;
  section: number;
  text: string;
}

function sectionToChunks(page: string, sectionIndex: number, section: Section) {
  const chunks: TextChunk[] = [];
  let lastWords = Number.MAX_SAFE_INTEGER;
  for (const paragraph of section.paragraphs ?? []) {
    const text = paragraph.sentences.map((sentence) => sentence.text).join(' ');
    const words = text.split(' ').length;

    // Check if the currently processed chunk can have more text added to it
    if (lastWords + words > CHUNK_MAX_WORDS) {
      // It can't -> new chunk
      chunks.push({ page, section: sectionIndex, text: '' });
      lastWords = 0;
    }
    // Append to chunk
    chunks[chunks.length - 1].text += '\n\n' + text;
  }

  return chunks;
}

function pageToChunks(page: Document): TextChunk[] {
  const pageId = page._id as string;
  const sections = page.sections as Section[];
  return sections.flatMap((section, i) => sectionToChunks(pageId, i, section));
}
