import { GTM_EVENT } from 'src/utils/googleTagManager'
import { addEventCategory } from 'src/utils/events/utils'

const SAFE_APPS = {
  OPEN_APP: {
    event: GTM_EVENT.CLICK,
    action: 'Open Safe App',
  },
}

const SAFE_APPS_CATEGORY = 'safe-apps'
export const SAFE_APPS_EVENTS = addEventCategory(SAFE_APPS, SAFE_APPS_CATEGORY)
