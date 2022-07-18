import { useEffect, useRef } from 'react'
import TagManager, { TagManagerArgs } from 'react-gtm-module'
import { matchPath, useLocation } from 'react-router-dom'
import {
  GOOGLE_TAG_MANAGER_ID,
  GOOGLE_TAG_MANAGER_AUTH_LIVE,
  IS_PRODUCTION,
  GOOGLE_TAG_MANAGER_DEVELOPMENT_AUTH,
  GOOGLE_TAG_MANAGER_ENV,
} from 'src/utils/constants'
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

type GTMEnvironment = 'LIVE' | 'STAGING' | 'DEVELOPMENT'
type GTMEnvironmentArgs = Required<Pick<TagManagerArgs, 'auth' | 'preview'>>

const GTM_ENV_AUTH: Record<GTMEnvironment, GTMEnvironmentArgs> = {
  LIVE: {
    auth: GOOGLE_TAG_MANAGER_AUTH_LIVE,
    preview: GOOGLE_TAG_MANAGER_ENV,
  },
  STAGING: {
    auth: GOOGLE_TAG_MANAGER_AUTH_LIVE,
    preview: GOOGLE_TAG_MANAGER_ENV,
  },
  DEVELOPMENT: {
    auth: GOOGLE_TAG_MANAGER_DEVELOPMENT_AUTH,
    preview: GOOGLE_TAG_MANAGER_ENV,
  },
}

export enum GTM_EVENT {
  PAGEVIEW = 'pageview',
  CLICK = 'customClick',
  META = 'metadata',
  SAFE_APP = 'safeApp',
}

let loaded = false
export const loadGoogleTagManager = (pathname: string): void => {
  const GTM_ENVIRONMENT = IS_PRODUCTION ? GTM_ENV_AUTH.LIVE : GTM_ENV_AUTH.DEVELOPMENT
  console.log('GTM_ENVIRONMENT', GTM_ENVIRONMENT)
  if (!GOOGLE_TAG_MANAGER_ID || !GTM_ENVIRONMENT.auth) {
    console.warn('[GTM] - Unable to initialize Google Tag Manager. `id` or `gtm_auth` missing.')
    return
  }

  const page_path = getAnonymizedPathname(pathname)

  TagManager.initialize({
    gtmId: GOOGLE_TAG_MANAGER_ID,
    ...GTM_ENVIRONMENT,
    dataLayer: {
      // Must emit (custom) event in order to trigger page tracking
      event: GTM_EVENT.PAGEVIEW,
      chainId: getNetworkId(),
      pageLocation: `${location.origin}${page_path}`,
      pagePath: page_path,
      // Block JS variables and custom scripts
      // @see https://developers.google.com/tag-platform/tag-manager/web/restrict
      'gtm.blocklist': ['j', 'jsm', 'customScripts'],
    },
  })

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

    const page_path = getAnonymizedPathname(pathname)

    TagManager.dataLayer({
      dataLayer: {
        // Must emit (custom) event in order to trigger page tracking
        event: GTM_EVENT.PAGEVIEW,
        chainId: getNetworkId(),
        pageLocation: `${location.origin}${page_path}`,
        pagePath: page_path,
        // Clear dataLayer
        eventCategory: undefined,
        eventAction: undefined,
        eventLabel: undefined,
      },
    })
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

type SafeAppEventDataLayer = {
  event: GTM_EVENT.SAFE_APP
  safeAppName: string
  safeAppMethod: string
  safeAppEthMethod?: string
  safeAppSDKVersion?: string
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

export const trackSafeAppMessage = ({
  app,
  method,
  params,
  sdkVersion,
}: {
  app?: SafeApp
  method: string
  params?: any
  sdkVersion?: string
}): void => {
  const dataLayer: SafeAppEventDataLayer = {
    event: GTM_EVENT.SAFE_APP,
    safeAppName: getSafeAppName(app),
    safeAppMethod: method,
    safeAppEthMethod: params?.call,
    safeAppSDKVersion: sdkVersion,
  }

  track(dataLayer)
}

function track(dataLayer: EventDataLayer | SafeAppEventDataLayer) {
  if (!IS_PRODUCTION) {
    console.info('[GTM]', dataLayer)
  }

  if (!loaded) {
    return
  }

  TagManager.dataLayer({
    dataLayer,
  })
}
