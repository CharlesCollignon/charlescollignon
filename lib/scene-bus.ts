/**
 * Lets page sections tell the fixed 3D background when it is fully covered,
 * so it can stop rendering instead of burning GPU behind opaque panels.
 */
const bus = typeof window === "undefined" ? null : new EventTarget();

export function setSceneCovered(covered: boolean) {
  bus?.dispatchEvent(new CustomEvent("covered", { detail: covered }));
}

export function onSceneCovered(cb: (covered: boolean) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<boolean>).detail);
  bus?.addEventListener("covered", handler);
  return () => bus?.removeEventListener("covered", handler);
}
