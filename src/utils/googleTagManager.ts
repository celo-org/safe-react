import { useEffect, useRef } from 'react'
import ReactGA from 'react-ga4'
import { matchPath, useLocation } from 'react-router-dom'
import { IS_PRODUCTION, GA_MEASUREMENT_ID } from 'src/utils/constants'
import { Cookie, removeCookies } from 'src/logic/cookies/utils'
import { SafeApp } from 'src/routes/safe/components/Apps/types'
import { EMPTY_SAFE_APP } from 'src/routes/safe/components/Apps/utils'
import { getNetworkId } from 'src/config'
import { SAFE_ROUTES } from 'src/routes/routes'

export const getAnonymizedPathname = (pathname: string): string => {
  for (const route of Object.values(SAFE_ROUTES)) {
    const safeAddressMatch = matchPath(pathname, { path: route })
    if (safeAddressMatch) {
      return safeAddressMatch.path
    }
  }
  return pathname
}

export enum GTM_EVENT {
  PAGEVIEW = 'pageview',
  CLICK = 'customClick',
  META = 'metadata',
  SAFE_APP = 'safeApp',
}

let loaded = false
export const loadGoogleTagManager = (): void => {
  if (!IS_PRODUCTION) {
    console.info('[GA]', GA_MEASUREMENT_ID)
  }
  if (!GA_MEASUREMENT_ID) {
    console.warn('[GA] - Unable to initialize Google Analytics. `GA_MEASUREMENT_ID` missing.')
    return
  }

  ReactGA.initialize(GA_MEASUREMENT_ID, {
    testMode: !IS_PRODUCTION,
  })
  ReactGA.set({ chainId: getNetworkId() })

  loaded = true
}

export const unloadGoogleTagManager = (): void => {
  loaded = false
  if (!window.dataLayer) {
    return
  }

  const GOOGLE_ANALYTICS_COOKIE_LIST: Cookie[] = [
    { name: '_ga', path: '/' },
    { name: '_gat', path: '/' },
    { name: '_gid', path: '/' },
  ]

  removeCookies(GOOGLE_ANALYTICS_COOKIE_LIST)
}

export const usePageTracking = (): void => {
  const didMount = useRef(false)
  const { pathname } = useLocation()

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }

    ReactGA.send({ hitType: GTM_EVENT.PAGEVIEW, page: getAnonymizedPathname(pathname) })
  }, [pathname])
}

export type EventLabel = string | number | boolean | null
const tryParse = (value?: EventLabel): EventLabel | undefined => {
  if (typeof value !== 'string') {
    return value
  }
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

type EventDataLayer = {
  event: GTM_EVENT
  eventCategory: string
  eventAction: string
  eventLabel?: EventLabel
}

export type CustomEvent = {
  event: GTM_EVENT
  category: string
  action: string
  label?: EventLabel
}

export const trackEvent = ({ event, category, action, label }: CustomEvent): void => {
  const dataLayer: EventDataLayer = {
    event,
    eventCategory: category,
    eventAction: action,
    eventLabel: tryParse(label),
  }

  track(dataLayer)
}

export const getSafeAppName = (safeApp?: SafeApp): string => {
  if (!safeApp?.id) {
    return EMPTY_SAFE_APP
  }

  try {
    const parsedSafeApp = JSON.parse(safeApp.id)

    return parsedSafeApp.name || parsedSafeApp.url
  } catch (error) {
    return EMPTY_SAFE_APP
  }
}

function track(dataLayer: EventDataLayer) {
  const payload = {
    transport: 'beacon',
    action: dataLayer.eventAction,
    category: dataLayer.eventCategory,
    value: dataLayer.eventLabel as number,
  }

  if (!IS_PRODUCTION) {
    console.info('[GA]', dataLayer.event, payload)
  }

  if (!loaded) {
    return
  }

  ReactGA.event(dataLayer.event, payload)
}
