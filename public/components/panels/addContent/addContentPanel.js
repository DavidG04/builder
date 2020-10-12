import React from 'react'
import AddElementPanel from '../addElement/addElementPanel'
import AddTemplatePanel from '../addTemplate/addTemplatePanel'
import PanelNavigation from '../panelNavigation'
import Scrollbar from '../../scrollbar/scrollbar'
import Search from './lib/search'
import vcCake from 'vc-cake'

const workspaceStorage = vcCake.getStorage('workspace')

export default class AddContentPanel extends React.Component {
  static localizations = window.VCV_I18N && window.VCV_I18N()

  constructor (props) {
    super(props)

    this.state = {
      searchValue: '',
      rawSearchValue: ''
    }

    this.setActiveSection = this.setActiveSection.bind(this)
    this.handleSearch = this.handleSearch.bind(this)
    this.setFirstElement = this.setFirstElement.bind(this)
  }

  setActiveSection (type) {
    const action = type === 'addTemplate' ? 'addTemplate' : 'add'
    workspaceStorage.state('settings').set({
      action: action,
      element: {},
      tag: '',
      options: {}
    })
  }

  handleSearch (value) {
    this.setState({
      searchValue: value.toLowerCase().trim(),
      rawSearchValue: value
    })
  }

  setFirstElement () {
    this.setState({ applyFirstElement: this.state.searchValue })
  }

  render () {
    const controls = {
      addElement: {
        index: 0,
        type: 'addElement',
        title: AddContentPanel.localizations ? AddContentPanel.localizations.elements : 'Elements',
        searchPlaceholder: AddContentPanel.localizations ? AddContentPanel.localizations.searchContentElements : 'Search content elements',
        content: <AddElementPanel options={this.props.options} searchValue={this.state.searchValue} applyFirstElement={this.state.applyFirstElement} />
      },
      addTemplate: {
        index: 1,
        type: 'addTemplate',
        title: AddContentPanel.localizations ? AddContentPanel.localizations.templates : 'Templates',
        searchPlaceholder: AddContentPanel.localizations ? AddContentPanel.localizations.searchContentTemplates : 'Search content templates',
        content: <AddTemplatePanel searchValue={this.state.searchValue} />
      }
    }

    return (
      <div className='vcv-ui-tree-view-content vcv-ui-tree-view-content--full-width'>
        <Search
          onSearchChange={this.handleSearch}
          rawSearchValue={this.state.rawSearchValue}
          searchPlaceholder={controls[this.props.activeTab].searchPlaceholder}
          setFirstElement={this.setFirstElement}
        />
        <PanelNavigation controls={controls} activeSection={this.props.activeTab} setActiveSection={this.setActiveSection} />
        <div className='vcv-ui-tree-content-section'>
          <Scrollbar>
            {controls[this.props.activeTab].content}
          </Scrollbar>
        </div>
      </div>
    )
  }
}