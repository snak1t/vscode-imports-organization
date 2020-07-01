export function flatten<T>(collection: T[][]): T[] {
  const x: T[] = [];
  collection.forEach(c => {
    x.push(...c);
  });
  return x;
}

export function partition<T>(collection: T[], condition: (el: T) => boolean): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  for (let index = 0; index < collection.length; index++) {
    const item = collection[index];
    if (condition(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }

  return [truthy, falsy];
}
