import { trackEvent } from 'src/utils/googleTagManager'

export type TrackEvent = Parameters<typeof trackEvent>[0]

export function addEventCategory<T extends string>(
  events: Record<T, Omit<TrackEvent, 'category'>>,
  category: string,
): Record<T, TrackEvent> {
  return Object.entries(events).reduce(
    (events, [key, value]) => ({ ...events, [key]: { ...(value as typeof events), category } }),
    {} as Record<T, TrackEvent>,
  )
}
