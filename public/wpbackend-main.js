import vcCake from 'vc-cake'
import './polyfills'
import './sources/less/bootstrapBackend/init.less'
import './sources/css/wordpress.less'
import './config/variables'
import './config/wpbackend-services'
import './config/wpbackend-attributes'
import publicAPI from './resources/api/publicAPI'

const $ = require('expose?$!jquery')
$(() => {
  let $iframe = $('#vcv-editor-iframe')
  // Get a handle to the iframe element
  let iframe = $iframe.get(0)
  let iframeDoc = iframe ? iframe.contentDocument || iframe.contentWindow.document : null
  if (iframe && iframeDoc) {
    const iframeDocument = iframe.document
    $('[data-vcv="edit-fe-editor"]', iframeDocument).remove()
    vcCake.env('iframe', iframe)
    let isIframeLoaded = false

    let iframeLoadEvent = () => {
      if (!isIframeLoaded) {
        isIframeLoaded = true
      } else {
        return
      }
      vcCake.env('platform', 'wordpress').start(() => {
        vcCake.env('editor', 'backend')
        require('./editor/stores/elements/elementsStorage')
        require('./editor/stores/assetsBackend/assetsStorage')
        require('./editor/stores/workspaceStorage')
        if (vcCake.env('HUB_TEASER_ELEMENT_DOWNLOAD')) {
          require('./editor/stores/hub/hubElementsStorage')
          const hubElementsStorage = vcCake.getStorage('hubElements')
          hubElementsStorage.trigger('start')
        }
        require('./editor/stores/history/historyStorage')
        require('./editor/stores/settingsStorage')
        require('./editor/stores/wordpressBackendData/wordpressBackendDataStorage')
        require('./resources/components/backendEditorContent/content.js')
        require('./config/wpbackend-modules')
      })
      vcCake.env('iframe', iframe.contentWindow)
    }

    $iframe.on('load', iframeLoadEvent)
    // Check if loading is complete
    const isContentLoaded = $iframe.get(0).contentWindow.document.body &&
      $iframe.get(0).contentWindow.document.body.getAttribute('class') &&
      $iframe.get(0).contentWindow.document.body.childNodes.length

    if (iframeDoc && iframeDoc.readyState === 'complete' && isContentLoaded) {
      iframeLoadEvent()
    }
  }
})
if (vcCake.env('debug') === true) {
  window.app = vcCake
}

window.vcv = publicAPI
