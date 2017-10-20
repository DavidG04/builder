import React from 'react'
import ReactDOM from 'react-dom'
import lodash from 'lodash'
import YoutubeBackground from './youtubeBackground'
import VimeoBackground from './vimeoBackground'
import ImageSimpleBackground from './imageSimpleBackground'
import ImageBackgroundZoom from './imageBackgroundZoom'
import ImageSlideshowBackground from './imageSlideshowBackground'
import EmbedVideoBackground from './embedVideoBackground'
import ColorGradientBackground from './colorGradientBackground'
import ParallaxBackground from './parallaxBackground'
import Divider from './divider'

const { Component, PropTypes } = React

export default class ElementComponent extends Component {
  static propTypes = {
    id: PropTypes.string,
    api: PropTypes.object,
    atts: PropTypes.object,
    editor: PropTypes.object
  }

  updateInlineHtml (elementWrapper, html = '', tagString = '') {
    // const helper = document.createElement('vcvhelper')
    // const comment = document.createComment('[vcvSourceHtml]' + tagString + '[/vcvSourceHtml]')
    // elementWrapper.innerHTML = ''
    // let range = document.createRange()
    // let documentFragment = range.createContextualFragment(tagString)
    //
    // helper.appendChild(documentFragment)
    // elementWrapper.appendChild(comment)
    // elementWrapper.appendChild(helper)

    const helper = document.createElement('vcvhelper')
    elementWrapper.innerHTML = ''
    if (!tagString) {
      tagString = html
    }
    helper.setAttribute('data-vcvs-html', `${tagString}`)
    let range = document.createRange()
    let documentFragment = range.createContextualFragment(html)
    helper.appendChild(documentFragment)
    elementWrapper.appendChild(helper)
  }

  updateInlineScript (elementWrapper, tagString = '') {
    const helper = document.createElement('vcvhelper')
    elementWrapper.innerHTML = ''
    let scriptHtml = `<script type="text/javascript">${tagString}</script>`
    helper.setAttribute('data-vcvs-html', `${scriptHtml}`)
    let script = document.createElement('script')
    script.type = 'text/javascript'
    let escapedString = escape(tagString)
    script.text = `try{ 
eval(unescape('${escapedString}'))
} catch(e) {}`
    // TODO: add catched error message to console..
    helper.appendChild(script)
    elementWrapper.appendChild(helper)
  }

  getDomNode () {
    return ReactDOM.findDOMNode(this)
  }

  getBackgroundClass (designOptions) {
    let { device } = designOptions
    let classes = []
    if (device) {
      let { all } = device
      if (all && (all.backgroundColor !== undefined || (all.images && all.images.urls && all.images.urls.length))) {
        classes.push('vce-element--has-background')
      } else {
        for (let currentDevice in device) {
          if (device[ currentDevice ] && (device[ currentDevice ].backgroundColor !== undefined || (device[ currentDevice ].images && device[ currentDevice ].images.urls && device[ currentDevice ].images.urls.length))) {
            classes.push(`vce-element--${currentDevice}--has-background`)
          }
        }
      }
    }
    return classes.join(' ')
  }

  applyDO (prop) {
    let propObj = {}

    // checking all
    if (prop === 'all') {
      prop += ` el-${this.props.id}`
      propObj[ 'data-vce-do-apply' ] = prop

      let animationData = this.getAnimationData()
      if (animationData) {
        propObj[ 'data-vce-animate' ] = animationData
      }
      return propObj
    }

    // checking animate
    if (prop.indexOf('animation') >= 0) {
      if (prop !== 'animation') {
        prop = prop.replace('animation', '')
        prop += ` el-${this.props.id}`
        propObj[ 'data-vce-do-apply' ] = prop
      }

      let animationData = this.getAnimationData()
      if (animationData) {
        propObj[ 'data-vce-animate' ] = animationData
      }
      return propObj
    }

    prop += ` el-${this.props.id}`
    propObj[ 'data-vce-do-apply' ] = prop
    return propObj
  }

  getAnimationData () {
    let animationData = ''
    let designOptions = this.props.atts && (this.props.atts.designOptions || this.props.atts.designOptionsAdvanced)

    if (designOptions && designOptions.device) {
      let animations = []
      Object.keys(designOptions.device).forEach((device) => {
        let prefix = (device === 'all') ? '' : device
        if (designOptions.device[ device ].animation) {
          if (prefix) {
            prefix = `-${prefix}`
          }
          animations.push(`vce-o-animate--${designOptions.device[ device ].animation}${prefix}`)
        }
      })
      if (animations.length) {
        animationData = animations.join(' ')
      }
    }
    return animationData
  }

  getMixinData (mixinName) {
    const vcCake = require('vc-cake')
    const assetsStorage = vcCake.getService('modernAssetsStorage').getGlobalInstance()
    let returnData = null
    let mixinData = assetsStorage.getCssMixinsByElement(this.props.atts)
    let { tag } = this.props.atts
    if (mixinData[ tag ] && mixinData[ tag ][ mixinName ]) {
      let mixin = Object.keys(mixinData[ tag ][ mixinName ])
      mixin = mixin.length ? mixin.pop() : null
      if (mixin) {
        returnData = mixinData[ tag ][ mixinName ][ mixin ]
      }
    }
    return returnData
  }

  getAttributeMixinData (attributeName) {
    const vcCake = require('vc-cake')
    const assetsStorage = vcCake.getService('modernAssetsStorage').getGlobalInstance()
    let returnData = null
    let mixinData = assetsStorage.getAttributesMixinsByElement(this.props.atts)
    let { tag } = this.props.atts
    if (mixinData[ tag ] && mixinData[ tag ][ attributeName ] && mixinData[ tag ][ attributeName ].variables) {
      returnData = mixinData[ tag ][ attributeName ].variables
    }
    return returnData
  }

  getBackgroundTypeContent () {
    let { designOptionsAdvanced } = this.props.atts
    if (lodash.isEmpty(designOptionsAdvanced) || lodash.isEmpty(designOptionsAdvanced.device)) {
      return null
    }
    let { device } = designOptionsAdvanced
    let backgroundData = []
    Object.keys(device).forEach((deviceKey) => {
      let { parallax, gradientOverlay } = device[ deviceKey ]
      let backgroundElements = []
      let reactKey = `${this.props.id}-${deviceKey}-${device[ deviceKey ].backgroundType}`
      switch (device[ deviceKey ].backgroundType) {
        case 'imagesSimple':
          backgroundElements.push(
            <ImageSimpleBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
              key={reactKey} atts={this.props.atts} />)
          break
        case 'backgroundZoom':
          backgroundElements.push(
            <ImageBackgroundZoom deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
              key={reactKey} atts={this.props.atts} />)
          break
        case 'imagesSlideshow':
          backgroundElements.push(
            <ImageSlideshowBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
              key={reactKey} atts={this.props.atts} />)
          break
        case 'videoYoutube':
          backgroundElements.push(
            <YoutubeBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
              key={reactKey} atts={this.props.atts} />)
          break
        case 'videoVimeo':
          backgroundElements.push(
            <VimeoBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
              key={reactKey} atts={this.props.atts} />)
          break
        case 'videoEmbed':
          backgroundElements.push(
            <EmbedVideoBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
              key={reactKey} atts={this.props.atts} />)
          break
      }

      // parallax
      if (gradientOverlay) {
        reactKey = `${this.props.id}-${deviceKey}-${device[ deviceKey ]}-gradientOverlay`
        backgroundElements.push(
          <ColorGradientBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
            key={reactKey} atts={this.props.atts} applyBackground={this.applyDO('gradient')} />)
      }

      if (parallax) {
        reactKey = `${this.props.id}-${deviceKey}-${device[ deviceKey ]}-parallax`
        backgroundData.push(
          <ParallaxBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
            key={reactKey} atts={this.props.atts} content={backgroundElements} />)
      } else {
        backgroundData.push(backgroundElements)
      }
    })
    if (backgroundData.length) {
      return <div className='vce-content-background-container'>
        {backgroundData}
      </div>
    }
    return null
  }

  getContainerDivider () {
    const vcCake = require('vc-cake')
    let { designOptionsAdvanced, dividers } = this.props.atts

    if (vcCake.env('NEW_DIVIDER_SHAPES')) {
      if (lodash.isEmpty(dividers) || lodash.isEmpty(dividers.device)) {
        return null
      }

      let { device } = dividers
      let dividerElements = []
      let customDevices = []
      let parallaxDevices = []
      let actualDevices = []
      let designOptionsDevices = designOptionsAdvanced && designOptionsAdvanced.device

      designOptionsDevices && Object.keys(designOptionsDevices).forEach((device) => {
        if (device !== 'all') {
          customDevices.push(device)
        }
        if (designOptionsDevices[ device ].hasOwnProperty('parallax')) {
          parallaxDevices.push(device)
        }
      })

      if (customDevices.length && parallaxDevices.length) {
        actualDevices = customDevices
      } else {
        Object.keys(device).forEach((device) => {
          actualDevices.push(device)
        })
      }

      actualDevices.forEach((deviceKey, index) => {
        let dividerDeviceKey = device[ deviceKey ] ? deviceKey : 'all'
        let dividerDeviceData = device[ dividerDeviceKey ]
        let { dividerTop, dividerBottom } = dividerDeviceData
        let parallaxKey = (parallaxDevices.indexOf('all') === -1 && parallaxDevices.indexOf(deviceKey) > -1) ? deviceKey : 'all'

        if (dividerTop) {
          let reactKey = `${this.props.id}-${deviceKey}-top-${index}`
          let dividerElement = (
            <Divider deviceData={dividerDeviceData} deviceKey={deviceKey} type={'Top'}
              metaAssetsPath={this.props.atts.metaAssetsPath} key={reactKey} id={this.props.id}
              applyDivider={this.applyDO('divider')} />
          )

          if (parallaxDevices.indexOf(deviceKey) > -1 || parallaxDevices.indexOf('all') > -1) {
            dividerElements.push(
              <ParallaxBackground deviceData={designOptionsAdvanced.device[ parallaxKey ]} deviceKey={parallaxKey}
                reactKey={reactKey}
                key={reactKey} atts={this.props.atts} content={dividerElement} divider={dividerTop} />
            )
          } else {
            dividerElements.push(dividerElement)
          }
        }

        if (dividerBottom) {
          let reactKey = `${this.props.id}-${deviceKey}-bottom-${index}`

          let dividerElement = (
            <Divider deviceData={dividerDeviceData} deviceKey={deviceKey} type={'Bottom'}
              metaAssetsPath={this.props.atts.metaAssetsPath} key={reactKey} id={this.props.id}
              applyDivider={this.applyDO('divider')} />
          )

          if (parallaxDevices.indexOf(deviceKey) > -1 || parallaxDevices.indexOf('all') > -1) {
            dividerElements.push(
              <ParallaxBackground deviceData={designOptionsAdvanced.device[ parallaxKey ]} deviceKey={parallaxKey}
                reactKey={reactKey}
                key={reactKey} atts={this.props.atts} content={dividerElement} divider={dividerBottom} />
            )
          } else {
            dividerElements.push(dividerElement)
          }
        }
      })

      if (dividerElements.length === 0) {
        return null
      }

      return <div className='vce-dividers-wrapper'>
        {dividerElements}
      </div>
    } else {
      if (lodash.isEmpty(designOptionsAdvanced) || lodash.isEmpty(designOptionsAdvanced.device)) {
        return null
      }

      let { device } = designOptionsAdvanced
      let dividerElements = []

      Object.keys(device).forEach((deviceKey, index) => {
        let { divider, parallax } = device[ deviceKey ]
        let reactKey = `${this.props.id}-${deviceKey}-${device[ deviceKey ]}-${index}`

        if (divider) {
          let dividerElement = (
            <Divider deviceData={device[ deviceKey ]} deviceKey={deviceKey}
              metaAssetsPath={this.props.atts.metaAssetsPath} key={reactKey} id={this.props.id}
              applyDivider={this.applyDO('divider')} />
          )

          if (parallax) {
            dividerElements.push(
              <ParallaxBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
                key={reactKey} atts={this.props.atts} content={dividerElement} divider={divider} />
            )
          } else {
            dividerElements.push(dividerElement)
          }
        }
      })

      if (dividerElements.length === 0) {
        return null
      }

      return <div className='vce-dividers-wrapper'>
        {dividerElements}
      </div>
    }
  }

  render () {
    return null
  }
}
