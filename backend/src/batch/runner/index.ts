import * as dotenv from 'dotenv';
dotenv.config({
  path: '../.env',
});

import { db } from '../../db/core';
import { eq } from 'drizzle-orm';
import { runner } from '../../db/schema';
import { createPod, destroyPod } from './runpod';

export class RunnerService {
  constructor(
    private runnerClass: string,
    private runpodKey: string,
    private runpodTemplate: string,
    private gpuChoices: string[],
  ) {}

  async stopAllRunners() {
    const runners = await db.query.runner.findMany({
      where: eq(runner.type, this.runnerClass),
    });
    await this.stopRunners(runners.map((runner) => runner.id));
  }

  async stopRunners(runners: string[]) {
    console.log('Stopping', runners.length, 'runners...');
    await Promise.all(
      runners.map(async (id) => {
        await destroyPod(this.runpodKey, id);
        await db.delete(runner).where(eq(runner.id, id));
      }),
    );
    console.log('Runners stopped!');
  }

  async createRunners(count: number): Promise<string[]> {
    console.log('Creating', count, 'runners');
    const podIds = [];
    let gpuIndex = 0;
    for (let i = 0; i < count; i++) {
      let id: string;
      try {
        id = await createPod(
          this.runpodKey,
          this.runpodTemplate,
          this.gpuChoices[gpuIndex],
        );
        console.log('Started instance with ', this.gpuChoices[gpuIndex]);
      } catch (e) {
        i--;
        gpuIndex++;
        if (gpuIndex == this.gpuChoices.length) {
          throw new Error('runpod ran out of acceptable GPUs');
        }
        console.log('Out of GPUs, trying', this.gpuChoices[gpuIndex], 'next');
        continue;
      }
      await db.insert(runner).values({ id: id, type: 'batchEmbed' });
      podIds.push(id);
    }
    console.log('Runners created');
    return podIds;
  }
}
