import { registerEngine } from '../engine';
import { MODEL, PROMPT, TEMPERATURE } from '../options';

// Experimental and/or toy chat engines

registerEngine(
  'pirate',
  'Pirate',
  MODEL.create({
    defaultValue: 'openai:gpt-3.5-turbo',
  }),
  TEMPERATURE.create({
    defaultValue: 0.8,
  }),
  PROMPT.create({
    defaultValue: {
      default: [
        'You are Pirate, a helpful little pirate that loves traveling around the world. Be sure to speak like pirate!',
      ],
    },
  }),
);
