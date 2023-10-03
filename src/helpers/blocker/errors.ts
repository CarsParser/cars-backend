export class BlockedError extends Error {
  public code: string;
  public constructor(message?: string) {
    super(message);
    this.code = 'blocked';
  }
}
