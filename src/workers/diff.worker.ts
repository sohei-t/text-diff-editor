import { DiffEngine } from '../engine/DiffEngine';

const engine = new DiffEngine();

interface DiffWorkerMessage {
  id: string;
  textA: string;
  textB: string;
}

self.onmessage = (e: MessageEvent<DiffWorkerMessage>) => {
  const { id, textA, textB } = e.data;
  const result = engine.computeLineDiff(textA, textB);
  self.postMessage({ id, result });
};
