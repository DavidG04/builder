var React = require('react');
var Mediator = require('../../../helpers/Mediator'); // need to remove too
var TreeElement = require('../layouts/tree/TreeLayout');
var AddElementModal = require('./add-element/AddElement.js');
var classNames = require('classnames');

require('./less/navbar/navbar-init.less');

module.exports = React.createClass(Mediator.installTo({
	getInitialState: function() {
		return {
			menuExpand: false
		}
	},
    componentDidMount: function() {
      this.subscribe('layout:tree', function(){
        this.setState({menuExpand: true});
      }.bind(this));
    },
    openAddElement: function (e) {
        e && e.preventDefault();
        this.publish('app:add', 'vc-v-root-element');
    },
	clickMenuExpand: function() {
		this.setState({menuExpand: !this.state.menuExpand});
	},
    clickSaveData: function() {
      this.publish('app:save', true);
    },
    render: function () {
		var menuExpandClass = classNames({
			'dropdown': true,
			'open': this.state.menuExpand
		});
        return (
            <nav className="navbar navbar-vc navbar-fixed-top">
                <div className="navbar-header">
                    <a className="navbar-brand"><span className="vcv-logo"></span></a>
                </div>
                <ul className="nav navbar-nav">
                    <li><a className="as_btn" onClick={this.openAddElement}><span className="glyphicon glyphicon-plus"></span></a></li>
                    <li role="presentation" className={menuExpandClass}>
                        <a className="dropdown-toggle as_btn" href="#" onClick={this.clickMenuExpand}>
                            <span className="glyphicon glyphicon-align-justify"></span> <span className="caret"></span>
                        </a>
                        <TreeElement/>
                    </li>
                </ul>
                <ul className="nav navbar-nav pull-right">
                    <li><button type="button" className="btn btn-default navbar-btn" onClick={this.clickSaveData}>Save</button></li>
                </ul>
				<div className="vc_ui-inline-editor-container"></div>
                <AddElementModal/>
            </nav>
        );
    }
}));