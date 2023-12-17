import { registerEngine } from '../engine';
import { MODEL, PROMPT, TEMPERATURE } from '../options';

registerEngine(
  'simple',
  'Simple',
  MODEL.create({
    defaultValue: 'openai:gpt-3.5-turbo',
    choices: [
      { value: 'openai:gpt-3.5-turbo', title: 'GPT-3.5 (default)' },
      { value: 'openai:gpt-4', title: 'GPT-4' },
      { value: 'bedrock:claude-instant-v1', title: 'Claude Instant' },
      { value: 'bedrock:claude-v2', title: 'Claude 2' },
      { value: 'bedrock:cohere-command', title: 'Cohere Command' },
      { value: 'together:mixtral-8x7', title: 'Mixtral 8x7B' },
      {
        value: 'together:openhermes-2.5-mistral',
        title: 'OpenHermes 2.5 Mistral',
      },
      { value: 'perplexity:pplx-7b', title: 'Perplexity 7B' },
      { value: 'perplexity:pplx-7b-online', title: 'Perplexity 7B (online)' },
      { value: 'perplexity:pplx-70b', title: 'Perplexity 70B' },
      { value: 'perplexity:pplx-70b-online', title: 'Perplexity 70B (online)' },
      { value: 'anyscale:llama-2-7b', title: 'Llama 2 7B' },
      { value: 'anyscale:llama-2-13b', title: 'Llama 2 13B' },
      { value: 'perplexity:llama-2-70b', title: 'Llama 2 70B' },
      { value: 'perplexity:codellama-34b', title: 'CodeLlama 34B' },
      { value: 'perplexity:mistral-7b', title: 'Mistral 7B v0.1' },
      { value: 'deepinfra:mistrallite', title: 'MistralLite' },
      { value: 'deepinfra:openchat-3.5', title: 'OpenChat 3.5' },
      { value: 'deepinfra:airoboros-70b', title: 'Airoboros 70B' },
      { value: 'deepinfra:mythomax-l2-13b', title: 'MythoMax 13B' },
      { value: 'deepinfra:airoboros-l2-70b', title: 'Airoboros 70B L2' },
      { value: 'deepinfra:lzlv-70b', title: 'LZLV 70B' },
      { value: 'selfhosted:tabby-api', title: 'Selfhosted experiment' },
    ],
    userEditable: true,
  }),
  TEMPERATURE.create({
    defaultValue: 0.3,
    start: 0,
    end: 1,
    userEditable: true,
  }),
  PROMPT.create({
    defaultValue: { default: ['You are a helpful AI assistant.'] },
  }),
);
