export async function sleep(ms: number) {
  new Promise((resolve) => setTimeout(resolve, ms));
}

import { blocker, BlockerFunction } from './blocker/index';
export { blocker, BlockerFunction };
