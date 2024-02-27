import { JSONSchemaType } from 'ajv';
import { Message } from '../service/message';
import { newAnalyzer } from './analyzer';
import { GenerateCallback, GenerateContext } from './pipeline';
import { batchCompletionsForModel } from '../service/completion';
import { MODEL } from './options';
import { Document, DocumentId } from '../service/document';
import { WikipediaStore } from '../service/impl/mongodb';
import { RerankService } from '../service/rerank';

/**
 * Data source that provides (hopefully) factual information for 'grounding'
 * LLM answers in reality.
 */
export type GroundDataSource = (query: string) => Promise<DocumentId[]>;

export function applyGrounding(
  sources: GroundDataSource[],
  documentStores: Record<string, WikipediaStore>,
  rerankSvc: RerankService,
): GenerateCallback {
  return async (ctx) => {
    // Generate various kinds of search queries
    const [question, query, hydeAnswer] = await Promise.all([
      generateQuestion(ctx.context),
      generateQuery(ctx.context),
      generateHydeAnswer(ctx),
    ]);

    const questionResults = sources.map((source) => source(question));
    const queryResults = sources.map((source) => source(query));
    const hydeResults = sources.map((source) => source(hydeAnswer));

    // Execute queries in parallel, flatten results to one array and de-duplicate them
    const documentIds = new Set(
      (await Promise.all([...questionResults, ...queryResults, ...hydeResults]))
        .flat()
        .map((id) => id.join('|')), // Join to make this set actually deduplicate
    );

    // Fetch results from document stores using dataset ids
    // We do this here to avoid fetching duplicate results/documents more than once
    const docIds = new Set(
      [...documentIds].map((id) => id.split('|')).map((id) => id.slice(0, 2)),
    );
    const documents = await Promise.all(
      [...docIds].map((id) => documentStores[id[0]].get(id[1])),
    );
    const docMap: Record<string, Document> = {};
    for (const doc of documents) {
      if (doc) {
        docMap[doc.id] = doc;
      }
    }

    // Get relevant sections from documents
    const results = [...documentIds]
      .map((id) => id.split('|'))
      .map((id) => docMap[id[1]].sections[parseInt(id[2])]);
    if (results.length == 0) {
      ctx.context[0].text += `\n\nYou do not know anything about "${query}". Let the user know this if they ask about it.`;
      return;
    }

    // Rerank results!
    const rerankedResults = await rerankSvc(results, question);

    // Inject up to 1000 words of results into system prompt
    const includedResults = rerankedResults.splice(0, 3).join('\n\n');

    ctx.context[0].text += `\n\nYou know the following about the topic "${query}":
${includedResults}
---
Use this and ONLY this to answer the user's question!`;
  };
}

const CHECK_SCHEMA: JSONSchemaType<{ message_type: string }> = {
  type: 'object',
  properties: {
    message_type: {
      type: 'string',
      description:
        'Classification of the last message (question, analysis, task, other)',
      enum: ['question', 'analysis', 'task', 'other'],
    },
  },
  required: ['message_type'],
};

const CHECK_GENERATOR = newAnalyzer(
  'together:mixtral-8x7',
  `Please classify it. Did the user ask a question (or request analysis) that requires a factual answer, provide a specific task (such as writing a poem), or something else?`,
  CHECK_SCHEMA,
);

async function checkQuestion(ctx: Message[]) {
  const text = `Below is an message sent by user to an AI chat bot:

${ctx[ctx.length - 1].text ?? ''}`;
  const reply = await CHECK_GENERATOR(text);
  return reply.message_type;
}

const QUESTION_SCHEMA: JSONSchemaType<{ question: string }> = {
  type: 'object',
  properties: {
    question: {
      type: 'string',
      description: 'Question for a human expert',
    },
  },
  required: ['question'],
};

const QUESTION_GENERATOR = newAnalyzer(
  'together:mixtral-8x7',
  `Please rephrase user's last message as a self-contained question that a librarian or another researcher could answer.`,
  QUESTION_SCHEMA,
);

async function generateQuestion(ctx: Message[]) {
  const text = `Below is an excerpt from a conversation between a user and a research AI assistant:

${ctx
  .filter((msg) => msg.type == 'bot' || msg.type == 'user')
  .filter((msg) => msg.text)
  .map((msg) =>
    msg.type == 'user' ? `User: ${msg.text}` : `Assistant: ${msg.text ?? ''}`,
  )
  .join('\n\n')}`;
  const reply = await QUESTION_GENERATOR(text);
  return reply.question;
}

const QUERY_SCHEMA: JSONSchemaType<{ query: string }> = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'Query for a search engine',
    },
  },
  required: ['query'],
};

const QUERY_GENERATOR = newAnalyzer(
  'together:mistral-7b-v1',
  `Please write a search query based on user's last message. Write a keyword search query, not full sentences!`,
  QUERY_SCHEMA,
);

async function generateQuery(ctx: Message[]) {
  const text = `Below is an excerpt from a conversation between a user and a research AI assistant:

${ctx
  .filter((msg) => msg.type == 'bot' || msg.type == 'user')
  .filter((msg) => msg.text)
  .map((msg) =>
    msg.type == 'user' ? `User: ${msg.text}` : `Assistant: ${msg.text ?? ''}`,
  )
  .join('\n\n')}`;
  const reply = await QUERY_GENERATOR(text);
  return reply.query;
}

async function generateHydeAnswer(ctx: GenerateContext) {
  const messages = [...ctx.context];
  messages[0].text = `You are a precise yet helpful AI assistant. Please be brief in your answers. If you don't know something, feel free to guess!`;
  const completions = batchCompletionsForModel(MODEL.getOrThrow(ctx));
  return await completions(ctx.context, {
    maxTokens: 200,
  });
}
