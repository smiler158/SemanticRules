/*
 * Copyright (C) Vulcan Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program.If not, see <http://www.gnu.org/licenses/>.
 *
 */

/**
 * @file
 * @ingroup SRRuleTypes
 * 
 * @defgroup SRRuleTypes Semantic rule types
 * @ingroup SemanticRules
 *  
 * @author: Kai K�hn
 *
 */

var $=$P;
var RuleToolBar = Class.create();

var SMW_RULE_VALID_RULE_NAME =
	'smwValidValue="^[^<>\|!&$%&\/=\?]{1,255}$: valid ' +
		'? (color: white, hideMessage, valid:true) ' +
	 	': (color: red, showMessage:RULE_NAME_TOO_LONG, valid:false)" ';

var SMW_RULE_CHECK_EMPTY = 
	'smwCheckEmpty="empty' +
		'? (color:red, showMessage:MUST_NOT_BE_EMPTY, valid:false) ' +
		': (color:white, hideMessage)"';

var SMW_RULE_NO_EMPTY_SELECTION =
	'smwCheckEmpty="empty' +
	'? (color:red, showMessage:SELECTION_MUST_NOT_BE_EMPTY, valid:false) ' +
	': (color:white, hideMessage, valid:true)"';		

var SMW_RULE_ALL_VALID =	
	'smwAllValid="allValid ' +
 		'? (show:rule-confirm, hide:rule-invalid) ' +
 		': (show:rule-invalid, hide:rule-confirm)"';
 		

RuleToolBar.prototype = {

initialize: function() {
	if (typeof(GenericToolBar) != "undefined") this.genTB = new GenericToolBar();
	this.toolbarContainer = null;
	this.showList = true;
	this.currentAction = "";
	this.typeMap = []; // Maps from the language dependent name of a rule type
					   // to the internal name
	this.currentEditObj = null;
},

showToolbar: function(){
	this.rulescontainer.setHeadline(gsrLanguage.getMessage('RULE_RULES'));
	if (wgAction == 'edit' || wgAction == 'formedit' ||
        wgCanonicalSpecialPageName == 'AddData' || wgCanonicalSpecialPageName == 'EditData' ||
        wgCanonicalSpecialPageName == 'FormEdit') {
		// Create a wiki text parser for the edit mode. In annotation mode,
		// the mode's own parser is used.
		this.wtp = new WikiTextParser();
	}
	
	this.fillList(true);

},

initToolbox: function(event){
	if((wgAction == "edit" || wgAction == "annotate" || wgAction == "formedit" ||
        wgCanonicalSpecialPageName == 'AddData' || wgCanonicalSpecialPageName == 'EditData' ||
        wgCanonicalSpecialPageName == 'FormEdit')
	    && stb_control.isToolbarAvailable() 
	    && (wgNamespaceNumber == 14 || wgNamespaceNumber == 102 ||
            (typeof sfgTargetNamespaceNumber != 'undefined' && 
             (sfgTargetNamespaceNumber == 100 || sfgTargetNamespaceNumber == 102))
           )) {
		this.rulescontainer = stb_control.createDivContainer(RULESCONTAINER, 0);
		this.showToolbar();		
	}
},


fillList: function(forceShowList) {

	if (forceShowList == true) {
		this.showList = true;
	}
	if (!this.showList) {
		return;
	}
	if (this.wtp) {
		this.wtp.initialize();
		this.rulescontainer.setContent(this.genTB.createList(this.wtp.getRules(),"rules"));
		this.rulescontainer.contentChanged();
	}
},


cancel: function(){
	
	if (this.currentEditObj != null) {
		this.currentEditObj.cancel();
	}
	
	/*STARTLOG*/
    smwhgLogger.log("","STB-Rules",this.currentAction+"_canceled");
	/*ENDLOG*/
	this.currentAction = "";
	
	this.toolbarContainer.hideSandglass();
	this.toolbarContainer.release();
	this.toolbarContainer = null;
	this.fillList(true);
},

/**
 * Creates a new toolbar for the rules container with the standard menu.
 * Further elements can be added to the toolbar. Call <finishCreation> after the
 * last element has been added.
 * 
 * @param string attributes
 * 		Attributes for the new container
 * @return 
 * 		A new toolbar container
 */
createToolbar: function(attributes) {
	if (this.toolbarContainer) {
		this.toolbarContainer.release();
	}
	
	this.toolbarContainer = new ContainerToolBar('rules-content',1200,this.rulescontainer);
	var tb = this.toolbarContainer;
	tb.createContainerBody(attributes);
	return tb;
},

createRule: function() {

	this.currentAction = "create rule";

	/*STARTLOG*/
    smwhgLogger.log('',"STB-Rules","create_clicked");
	/*ENDLOG*/
	
	var tb = this.createToolbar(SMW_RULE_ALL_VALID);	
	tb.append(tb.createText('rule-help_msg', gsrLanguage.getMessage('RULE_CREATE'), '' , true));
	tb.append(tb.createInput('rule-name', gLanguage.getMessage('NAME'), '', '',
	                         SMW_RULE_CHECK_EMPTY +
	                         SMW_RULE_VALID_RULE_NAME,
	                         true));
	tb.setInputValue('rule-name','');
	tb.append(tb.createText('rule-name-msg', gLanguage.getMessage('ENTER_NAME'), '' , true));
	
	tb.append(tb.createDropDown('rule-type', gsrLanguage.getMessage('RULE_TYPE'), 
	                            this.getRuleTypes(), 
	                            0,0, 
	                            SMW_RULE_NO_EMPTY_SELECTION, true));
		
	var links = [['ruleToolBar.doCreateRule()',gLanguage.getMessage('CREATE'), 'rule-confirm', gLanguage.getMessage('INVALID_VALUES'), 'rule-invalid'],
				 ['ruleToolBar.cancel()', gLanguage.getMessage('CANCEL')]
				];
	
	tb.append(tb.createLink('rule-links', links, '', true));
				
	tb.finishCreation();
	gSTBEventActions.initialCheck($("rules-content-box"));
	
	//Sets Focus on first Element
	setTimeout("$('rule-name').focus();",50);
},

/**
 * Called from the UI if a new rule should be created or an existing rule should
 * be edited.
 * 
 * @param WtpRule rule
 * 		If this parameter is defined, the given rule will be edited. Otherwise
 * 		a new rule will be created.
 */
doCreateRule: function(rule) {
	var rt = $('rule-type');
	rt = rt.options[rt.selectedIndex].text;

	for (var i = 0; i < this.typeMap.length; i += 2) {
		if (this.typeMap[i] == rt) {
			rt = this.typeMap[i+1];
			break;
		}
	}
	
	$('rule-confirm').hide();
	$('rule-type').disable();
	
	if (rt == "Definition") {
		// Create/edit a definition rule for categories or properties
		var cr = new CategoryRule($('rule-name').value, rt);
		this.currentEditObj = cr;
		cr.createRule();
	} else if (rt == "Calculation") {
		// Create/edit a calculation rule for properties
		var cr = new CalculationRule($('rule-name').value, rt);
		this.currentEditObj = cr;
		cr.editRule();
	} else if (rt == "Property chaining") {
		// Create/edit a definition rule for properties
		var pcr = new PropertyChain($('rule-name').value, rt);
		this.currentEditObj = pcr;
		pcr.createChain();
	}
},

editRule: function(selindex) {

	this.showList = false;
	this.currentAction = "edit rule";
	this.wtp.initialize();

	var rules = this.wtp.getRules();
	if (   selindex == null
	    || selindex < 0
	    || selindex >= rules.length) {
		// Invalid index
		return;
	}

	/*STARTLOG*/
    smwhgLogger.log('',"STB-Rules","edit_clicked");
	/*ENDLOG*/

	var rule = rules[selindex];
	var ruleName = rule.name;
	var pos = ruleName.lastIndexOf('/');
	if (pos != -1) {
		ruleName = ruleName.substr(pos+1);
	}
	
	var tb = this.createToolbar(SMW_RULE_ALL_VALID);	
	tb.append(tb.createText('rule-help_msg', gsrLanguage.getMessage('RULE_EDIT'), '' , true));
	tb.append(tb.createInput('rule-name', gLanguage.getMessage('NAME'), '', '',
	                         SMW_RULE_CHECK_EMPTY +
	                         SMW_RULE_VALID_RULE_NAME,
	                         true));
	tb.setInputValue('rule-name', ruleName);
	tb.append(tb.createText('rule-name-msg', gLanguage.getMessage('ENTER_NAME'), '' , true));
			
	var links = [['ruleToolBar.cancel()', gLanguage.getMessage('CANCEL')]
				];
	
	tb.append(tb.createLink('rule-links', links, '', true));
				
	tb.finishCreation();
	gSTBEventActions.initialCheck($("rules-content-box"));
	
	//Sets Focus on first Element
	setTimeout("$('rule-name').focus();",50);

	for (var i = 0; i < this.typeMap.length; i += 2) {
		if (this.typeMap[i] == rule.type) {
			rule.type = this.typeMap[i+1];
			break;
		}
	}
	if (rule.type == gsrLanguage.getMessage('RULE_TYPE_DEFINITION')) {
		// Edit a definition rule for categories of properties
		var cr = new CategoryRule(ruleName, rule.type);
		this.currentEditObj = cr;
		cr.editRule(rule);
	} else if (rule.type == gsrLanguage.getMessage('RULE_TYPE_CALCULATION')) {
		// Edit a calculation rule for properties
		var cr = new CalculationRule(ruleName, rule.type);
		this.currentEditObj = cr;
		cr.editRule(rule);
	} else if (rule.type == gsrLanguage.getMessage('RULE_TYPE_PROP_CHAINING')) {
		// Edit a property chaining rule
		var pcr = new PropertyChain(ruleName, rule.type);
		this.currentEditObj = pcr;
		pcr.editChain(rule);
	} 	

},

deleteRule: function() {

	this.showList = false;
	this.currentAction = "delete rule";

	/*STARTLOG*/
    smwhgLogger.log('',"STB-Rules","delete_clicked");
	/*ENDLOG*/
	
},

getRuleTypes: function() {
	switch (wgNamespaceNumber) {
		case 14: // Category
			this.typeMap = [gsrLanguage.getMessage('RULE_TYPE_DEFINITION'), "Definition"];
			return [gsrLanguage.getMessage('RULE_TYPE_DEFINITION')];
		case 102: //properties
			var hasType = gLanguage.getMessage('HAS_TYPE', 'cont');
			var page = gLanguage.getMessage('TYPE_PAGE').toLowerCase();
			var pagewons = gLanguage.getMessage('TYPE_PAGE_WONS').toLowerCase();
			var type = this.wtp.getRelation(hasType);
			if (type) {
				type = type[0].getValue().toLowerCase();
			}
			if (type == null || type == page || type == pagewons) {
				// object property
				this.typeMap = [gsrLanguage.getMessage('RULE_TYPE_DEFINITION'), "Definition",
				                gsrLanguage.getMessage('RULE_TYPE_PROP_CHAINING'), 'Property chaining'];
				return [gsrLanguage.getMessage('RULE_TYPE_DEFINITION'),
				        gsrLanguage.getMessage('RULE_TYPE_PROP_CHAINING')];
			} else {
				// data type property
				this.typeMap = [gsrLanguage.getMessage('RULE_TYPE_DEFINITION'), "Definition",
				                gsrLanguage.getMessage('RULE_TYPE_CALCULATION'), 'Calculation'];
				return [gsrLanguage.getMessage('RULE_TYPE_DEFINITION'),
				        gsrLanguage.getMessage('RULE_TYPE_CALCULATION')];
			}
	}
	return [];
}


};// End of Class

window.ruleToolBar = new RuleToolBar();
stb_control.registerToolbox(ruleToolBar);
