export async function sleep(ms: number) {
  new Promise((resolve) => setTimeout(resolve, ms));
}
import { ElkLogger } from './logger';

export { ElkLogger };

import { blocker, BlockerFunction } from './blocker/index';
export { blocker, BlockerFunction };
