import { registerService } from '../completion';
import { simpleTokenCounter } from '../tokenization';
import { anthropicCompletions } from './anthropic';
import { bedrockCompletions } from './bedrock';
import { multiStepCompletions } from './multi-step';
import { openAICompletions } from './openai';

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
  registerService(
    'openai:gpt-4-vision',
    openAICompletions(
      apiUrl,
      OPENAI_API_KEY,
      'chat',
      'gpt-4-vision-preview',
      true,
    ),
    simpleTokenCounter(0.3),
    {
      maxTokens: 128000,
      inputCost: 0.01,
      outputCost: 0.03,
      capabilities: ['image_input'],
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
    'perplexity:sonar-small',
    openAICompletions(apiUrl, PPLX_API_KEY, 'chat', 'sonar-small-chat'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 16384,
      inputCost: 0.0002,
      outputCost: 0.0002,
    },
  );
  registerService(
    'perplexity:sonar-medium',
    openAICompletions(apiUrl, PPLX_API_KEY, 'chat', 'sonar-medium-chat'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 16384,
      inputCost: 0.0006,
      outputCost: 0.0006,
    },
  );
  registerService(
    'perplexity:sonar-small-online',
    openAICompletions(apiUrl, PPLX_API_KEY, 'chat', 'sonar-small-online'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 12000,
      inputCost: 0.0002,
      outputCost: 0.0002,
    },
  );
  registerService(
    'perplexity:sonar-medium-online',
    openAICompletions(apiUrl, PPLX_API_KEY, 'chat', 'sonar-medium-online'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 12000,
      inputCost: 0.0006,
      outputCost: 0.0006,
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
  registerService(
    'together:mixtral-nous-hermes-2-dpo',
    openAICompletions(
      apiUrl,
      TOGETHER_API_KEY,
      'chat',
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

// Official Mistral API; mostly for the proprietary models
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
    openAICompletions(apiUrl, MISTRAL_API_KEY, 'mistral', 'mistral-small-2402'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 32768,
      inputCost: 0.0006,
      outputCost: 0.0018,
    },
  );
  registerService(
    'mistral:medium',
    openAICompletions(
      apiUrl,
      MISTRAL_API_KEY,
      'mistral',
      'mistral-medium-2312',
    ),
    simpleTokenCounter(0.3),
    {
      maxTokens: 32768,
      inputCost: 0.0025,
      outputCost: 0.0075,
    },
  );
  registerService(
    'mistral:large',
    openAICompletions(apiUrl, MISTRAL_API_KEY, 'mistral', 'mistral-large-2402'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 32768,
      inputCost: 0.008,
      outputCost: 0.024,
    },
  );
}

// Anthropic's official API
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (ANTHROPIC_API_KEY) {
  registerService(
    'anthropic:claude-3-opus',
    anthropicCompletions(ANTHROPIC_API_KEY, 'claude-3-opus-20240229'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 200_000,
      inputCost: 0.015,
      outputCost: 0.075,
      capabilities: ['image_input'],
    },
  );
  registerService(
    'anthropic:claude-3-sonnet',
    anthropicCompletions(ANTHROPIC_API_KEY, 'claude-3-sonnet-20240229'),
    simpleTokenCounter(0.3),
    {
      maxTokens: 200_000,
      inputCost: 0.003,
      outputCost: 0.015,
      capabilities: ['image_input'],
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
