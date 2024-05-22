import { GTM_EVENT } from 'src/utils/googleTagManager'
import { addEventCategory } from 'src/utils/events/utils'

const SETTINGS = {
  DETAILS: {
    SAFE_NAME: {
      event: GTM_EVENT.CLICK,
      action: 'Name Safe',
    },
  },
  OWNERS: {
    REMOVE_SAFE: {
      event: GTM_EVENT.CLICK,
      action: 'Remove Safe',
    },
    ADD_OWNER: {
      event: GTM_EVENT.CLICK,
      action: 'Add owner',
    },
    EDIT_OWNER: {
      event: GTM_EVENT.CLICK,
      action: 'Edit owner',
    },
    REPLACE_OWNER: {
      event: GTM_EVENT.CLICK,
      action: 'Replace owner',
    },
    REMOVE_OWNER: {
      event: GTM_EVENT.CLICK,
      action: 'Remove owner',
    },
  },
  THRESHOLD: {
    CHANGE: {
      event: GTM_EVENT.CLICK,
      action: 'Change threshold',
    },
    OWNERS: {
      event: GTM_EVENT.META,
      action: 'Owners',
    },
    THRESHOLD: {
      event: GTM_EVENT.META,
      action: 'Threshold',
    },
  },
  SPENDING_LIMIT: {
    NEW_LIMIT: {
      event: GTM_EVENT.CLICK,
      action: 'New spending limit',
    },
    RESET_PERIOD: {
      event: GTM_EVENT.META,
      action: 'Spending limit reset period',
    },
    REMOVE_LIMIT: {
      event: GTM_EVENT.CLICK,
      action: 'Remove spending limit',
    },
    LIMIT_REMOVED: {
      event: GTM_EVENT.CLICK,
      action: 'Spending limit removed',
    },
  },
} as const

const SETTINGS_CATEGORY = 'settings'
export const SETTINGS_EVENTS = {
  DETAILS: addEventCategory(SETTINGS.DETAILS, SETTINGS_CATEGORY),
  OWNERS: addEventCategory(SETTINGS.OWNERS, SETTINGS_CATEGORY),
  THRESHOLD: addEventCategory(SETTINGS.THRESHOLD, SETTINGS_CATEGORY),
  SPENDING_LIMIT: addEventCategory(SETTINGS.SPENDING_LIMIT, SETTINGS_CATEGORY),
} as const
