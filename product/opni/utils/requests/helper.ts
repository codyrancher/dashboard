export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

export function requestDelay() {
  const ms = (Math.random() * 5000) + 100;

  return delay(ms);
}
