export interface GpuType {
  id: string;
  displayName: string;
  memoryInGb: number;
}

export async function getGpuTypes(apiKey: string): Promise<GpuType[]> {
  const query = `query GpuTypes {
  gpuTypes {
    id
    displayName
    memoryInGb
  }
}`;
  const reply = (await makeRequest(apiKey, query)) as {
    data: {
      gpuTypes: GpuType[];
    };
  };
  return reply.data.gpuTypes;
}

export async function createPod(
  apiKey: string,
  templateId: string,
  gpuType: string,
): Promise<string> {
  const query = `mutation {
  podFindAndDeployOnDemand(
    input: {
      name: "engram runner"
      cloudType: COMMUNITY
      gpuTypeId: "${gpuType}"
      gpuCount: 1

      templateId: "${templateId}"
      volumeInGb: 0
      containerDiskInGb: 10
    }
  ) {
    id
  }
}`;
  const reply = (await makeRequest(apiKey, query)) as {
    data: { podFindAndDeployOnDemand: { id: string } };
  };
  if (!reply.data) {
    throw new Error('pod creation failed');
  }
  return reply.data.podFindAndDeployOnDemand.id;
}

export async function destroyPod(apiKey: string, podId: string) {
  const query = `mutation {
  podTerminate(
    input: {
      podId: "${podId}"
    }
  )
}`;
  const reply = (await makeRequest(apiKey, query)) as { data: object };
  if (!reply.data) {
    throw new Error('pod creation failed');
  }
}

export function getExposedPort(podId: string, port: number): string {
  return `https://${podId}-${port}.proxy.runpod.net`;
}

async function makeRequest(apiKey: string, query: string) {
  const response = await fetch(
    `https://api.runpod.io/graphql?api_key=${apiKey}`,
    {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  return response.json();
}
