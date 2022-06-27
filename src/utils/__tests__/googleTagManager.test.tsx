import * as TagManager from 'react-gtm-module'
import { matchPath } from 'react-router-dom'
import * as reactRouterDom from 'react-router-dom'
import { renderHook } from '@testing-library/react-hooks'
import { waitFor } from '@testing-library/react'
import { GTM_EVENT, usePageTracking } from '../googleTagManager'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  matchPath: jest.fn(),
}))

describe('googleTagManager', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.resetAllMocks()
  })
  describe('loadGoogleTagManager', () => {
    it('prevents init without a gtm id/auth', () => {
      jest.doMock('src/utils/constants.ts', () => {
        const original = jest.requireActual('src/utils/constants.ts')
        return {
          ...original,
          GOOGLE_TAG_MANAGER_ID: '',
          GOOGLE_TAG_MANAGER_DEVELOPMENT_AUTH: '',
        }
      })

      const mockInitialize = jest.fn()
      jest.doMock('react-gtm-module', () => ({
        initialize: mockInitialize,
      }))

      // doMock doesn't hoist
      const { loadGoogleTagManager } = require('src/utils/googleTagManager')
      loadGoogleTagManager()

      expect(mockInitialize).not.toHaveBeenCalled()
    })
    it('inits gtm with a pageview event', () => {
      jest.doMock('src/utils/constants.ts', () => {
        const original = jest.requireActual('src/utils/constants.ts')
        return {
          ...original,
          GOOGLE_TAG_MANAGER_ID: 'id123',
          GOOGLE_TAG_MANAGER_DEVELOPMENT_AUTH: 'auth123',
        }
      })

      jest.doMock('src/config', () => ({
        _getChainId: jest.fn(() => '4'),
      }))

      const mockInitialize = jest.fn()
      jest.doMock('react-gtm-module', () => ({
        initialize: mockInitialize,
      }))

      // doMock doesn't hoist
      const { loadGoogleTagManager } = require('src/utils/googleTagManager')
      loadGoogleTagManager()

      expect(mockInitialize).toHaveBeenCalledWith({
        gtmId: 'id123',
        auth: 'auth123',
        preview: 'env-3',
        dataLayer: {
          'gtm.blocklist': ['j', 'jsm', 'customScripts'],
          event: 'pageview',
          chainId: '4',
          pageLocation: 'http://localhost/',
          pagePath: '/',
        },
      })
    })
  })
  describe('usePageTracking', () => {
    it('dispatches a pageview event on page change', () => {
      const dataLayerSpy = jest.spyOn(TagManager.default, 'dataLayer').mockImplementation(jest.fn())

      const { waitFor } = renderHook(() => usePageTracking())

      waitFor(() => {
        expect(dataLayerSpy).toHaveBeenCalledWith({
          dataLayer: {
            event: 'pageview',
            chainId: '4',
            page: '/',
          },
        })
      })

      history.pushState({}, '/test1')
      history.pushState({}, '/test2')
      history.pushState({}, '/test3')

      waitFor(() => {
        expect(dataLayerSpy).toHaveBeenCalledTimes(4)
      })
    })
  })
  describe('trackEvent', () => {
    it('tracks a correctly formed event from the arguments', async () => {
      const mockDataLayer = jest.fn()
      jest.doMock('react-gtm-module', () => ({
        dataLayer: mockDataLayer,
      }))

      // doMock doesn't hoist
      const { trackEvent } = require('src/utils/googleTagManager')
      trackEvent({
        event: 'testEvent' as GTM_EVENT,
        category: 'unit-test',
        action: 'Track event',
        label: 1,
      })

      await waitFor(() => {
        expect(mockDataLayer).toHaveBeenCalledWith({
          dataLayer: {
            event: 'testEvent',
            chainId: '4',
            eventCategory: 'unit-test',
            eventAction: 'Track event',
            eventLabel: 1,
          },
        })
      })
    })
  })
})
