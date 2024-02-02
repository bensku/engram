import { registerService } from '../completion';
import { simpleTokenCounter } from '../tokenization';
import { bedrockCompletions } from './bedrock';
import { multiStepCompletions } from './multi-step';
import { openAICompletions } from './openai';
import { togetherCompletions } from './together';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (OPENAI_API_KEY) {
  const apiUrl = 'https://api.openai.com/v1';
  registerService(
    'openai:gpt-3.5-turbo',
    openAICompletions(apiUrl, OPENAI_API_KEY, 'chat', 'gpt-3.5-turbo-0125'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 16385,
      inputCost: 0.001,
      outputCost: 0.003,
    },
  );
  registerService(
    'openai:gpt-4',
    openAICompletions(apiUrl, OPENAI_API_KEY, 'chat', 'gpt-4-0125-preview'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 128000,
      inputCost: 0.01,
      outputCost: 0.03,
    },
  );
}

// Amazon Bedrock provides access to various commercial models, like Claude
if (process.env.AWS_ACCESS_KEY_ID) {
  registerService(
    'bedrock:claude-instant-v1',
    bedrockCompletions('anthropic.claude-instant-v1', 'claude'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 100000,
      inputCost: 0.0008,
      outputCost: 0.0024,
    },
  );
  registerService(
    'bedrock:claude-v2',
    bedrockCompletions('anthropic.claude-v2:1', 'claude'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 200000,
      inputCost: 0.008,
      outputCost: 0.024,
    },
  );
}

// Anyscale Endpoints hosts various open source models
const ANYSCALE_API_KEY = process.env.ANYSCALE_API_KEY;
if (ANYSCALE_API_KEY) {
  const apiUrl = 'https://api.endpoints.anyscale.com/v1';
  registerService(
    'anyscale:mixtral-8x7',
    openAICompletions(
      apiUrl,
      ANYSCALE_API_KEY,
      'chat',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
    ),
    simpleTokenCounter(0.3),
    {
      maxTokens: 32768,
      inputCost: 0.0005,
      outputCost: 0.0005,
    },
  );
}

// Perplexity has interesting custom LLMs
// (they also host a bunch of open source ones, if there is ever need to switch providers)
const PPLX_API_KEY = process.env.PPLX_API_KEY;
if (PPLX_API_KEY) {
  const apiUrl = 'https://api.perplexity.ai';
  registerService(
    'perplexity:pplx-7b',
    openAICompletions(apiUrl, PPLX_API_KEY, 'chat', 'pplx-7b-chat'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 8192,
      inputCost: 0.00007,
      outputCost: 0.00028,
    },
  );
  registerService(
    'perplexity:pplx-70b',
    openAICompletions(apiUrl, PPLX_API_KEY, 'chat', 'pplx-70b-chat'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 4096,
      inputCost: 0.0007,
      outputCost: 0.0028,
    },
  );
  registerService(
    'perplexity:pplx-7b-online',
    openAICompletions(apiUrl, PPLX_API_KEY, 'chat', 'pplx-7b-online'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 4096,
      inputCost: 0, // Per-request pricing, not supported yet
      outputCost: 0.00028,
    },
  );
  registerService(
    'perplexity:pplx-70b-online',
    openAICompletions(apiUrl, PPLX_API_KEY, 'chat', 'pplx-70b-online'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 4096,
      inputCost: 0, // Per-request pricing, not supported yet
      outputCost: 0.0028,
    },
  );
}

// Together AI has a large variety of open source models with good performance
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
if (TOGETHER_API_KEY) {
  const apiUrl = 'https://api.together.xyz';
  registerService(
    'together:mixtral-8x7',
    openAICompletions(
      apiUrl,
      TOGETHER_API_KEY,
      'chat',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
    ),
    simpleTokenCounter(0.3),
    {
      maxTokens: 32768,
      inputCost: 0.0006,
      outputCost: 0.0006,
    },
  );
  registerService(
    'together:mistral-7b',
    openAICompletions(
      apiUrl,
      TOGETHER_API_KEY,
      'chat',
      'mistralai/Mistral-7B-Instruct-v0.2',
    ),
    simpleTokenCounter(0.3),
    {
      maxTokens: 32768,
      inputCost: 0.0002,
      outputCost: 0.0002,
    },
  );
  registerService(
    'together:mistral-7b-v1',
    openAICompletions(
      apiUrl,
      TOGETHER_API_KEY,
      'chat',
      'mistralai/Mistral-7B-Instruct-v0.1',
    ),
    simpleTokenCounter(0.3),
    {
      maxTokens: 4096,
      inputCost: 0.0002,
      outputCost: 0.0002,
    },
  );
  // TODO maybe migrate fully to OpenAI client?
  registerService(
    'together:mixtral-nous-hermes-2-dpo',
    togetherCompletions(
      TOGETHER_API_KEY,
      'chatml',
      'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
    ),
    simpleTokenCounter(0.3),
    {
      maxTokens: 32768,
      inputCost: 0.0006,
      outputCost: 0.0006,
    },
  );
}

// Official Mistral API; at time of writing, mostly for mistral-medium
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
if (MISTRAL_API_KEY) {
  const apiUrl = 'https://api.mistral.ai/v1/';
  registerService(
    'mistral:tiny',
    openAICompletions(apiUrl, MISTRAL_API_KEY, 'mistral', 'mistral-tiny'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 32768,
      inputCost: 0.00014,
      outputCost: 0.00042,
    },
  );
  registerService(
    'mistral:small',
    openAICompletions(apiUrl, MISTRAL_API_KEY, 'mistral', 'mistral-small'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 32768,
      inputCost: 0.0006,
      outputCost: 0.0018,
    },
  );
  registerService(
    'mistral:medium',
    openAICompletions(apiUrl, MISTRAL_API_KEY, 'mistral', 'mistral-medium'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 32768,
      inputCost: 0.0025,
      outputCost: 0.0075,
    },
  );
}

// TODO figure out to gate this behind service availability
registerService(
  'engram:multi-step',
  multiStepCompletions(
    'together:mistral-7b',
    'together:mixtral-8x7',
    'together:mixtral-8x7',
  ),
  simpleTokenCounter(0.3),
  {
    maxTokens: 32768,
    // Cost is assumed to be a bit higher than base Mixtral
    inputCost: 0.001,
    outputCost: 0.001,
  },
);
