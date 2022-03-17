import { createSLO, SLO } from '~/product/opni/models/SLO';
import { requestDelay } from '~/product/opni/utils/requests/helper';

export interface Evaluation {
    rate: number;
    period: number; // Time in ms
}

export interface SLOResponse {
    id: string | null;
    clusterId: string;
    serviceId: string;
    name: string;
    timestamp: number;
    target: number;
    status: Evaluation;
    budget: Evaluation;
}

export async function getSLOs(): Promise<SLO[]> {
  await requestDelay();

  return slos;
}

export async function getSLO(id: string): Promise<SLO> {
  await requestDelay();

  return slos[0];
}

export async function upsertSLO() {
  await requestDelay();
}

export async function cloneSLO(slo: SLO): Promise<SLO> {
  await requestDelay();

  return createSLO(`${ slo.nameDisplay } - copy`, slo.serviceDisplay, slo.clusterDisplay);
}

const s0 = 'Best Service';
const s1 = 'Worst Service';
const c0 = 'Simple Cluster';
const c1 = 'Complicated Cluster';
const slos = [
  createSLO('Latency', s0, c0),
  createSLO('Uptime', s0, c0),
  createSLO('Disk Pressure', s0, c1),
  createSLO('Memory', s1, c0),
  createSLO('CPU Time', s1, c0),
];
