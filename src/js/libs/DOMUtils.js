/**
 * Utility functions for finding and manipulating elements in the document object model (DOM).
 * Also includes some rudimentary helpers for event handling.
 *
 * @author Dan Nye
 * @author Matthew Betts
 * @version 14.1.0
 * @since 13.4.0
 * @module
 */

function isEnumerableProperty(obj, property) {
	return Object.prototype.hasOwnProperty.call(obj, property) && Object.prototype.propertyIsEnumerable.call(obj, property);
}

var DOMUtils = (function() {
	var WHITE_SPACE_REGEX = /\s+/;

	/**
	 * Convenience function for iterating over a NodeList. callback is invoked for each element in the list.
	 * Return false from callback to stop iteration (much like jQuery each).
	 *
	 * @param nodeList a NodeList
	 * @param callback the function to call for each element in the list
	 */
	function loop(nodeList, callback) {
		/*
			There are some rare cases where a single node is passed here (e.g. minigames menus that only have one tab).
			In these cases, we still want the callback to be executed on the node. So, test for the 'length' property.

			DO NOT use "isEnumerableProperty" here, as the "length" property is erroneously considered enumerable by
			some versions of Chrome (see https://code.google.com/p/chromium/issues/detail?id=339202):

			var bn = document.querySelectorAll('body')
			console.log(Object.prototype.hasOwnProperty.call(bn, 'length'));
			console.log(Object.prototype.propertyIsEnumerable.call(bn, 'length'));

			- Chrome v35.0.1908.4 dev-m returns "true" for both of the above log lines.
			- Chrome v33.0.1750.154m returns "true" for the first, and "false" for the second.

			Update 03/11/2014: Firefox 28 and 32.0.1 (and most likely other versions), and IE 11 will return
			Boolean(false) for "Object.prototype.hasOwnProperty.call(nodeList, 'length')" when there is a
			length property available (with a value of 1). So, to give maximum compatibility, test for both
			hasOwnProperty (WekKit) and "'length' in nodeList" (Fx & IE).
		*/
		var localNodeList;
		var hasLengthWebKit = Object.prototype.hasOwnProperty.call(nodeList, 'length');
		var hasLengthFxAndIe = 'length' in nodeList;
		if (hasLengthWebKit || hasLengthFxAndIe) {
			localNodeList = nodeList;
		} else {
			localNodeList = [nodeList];
		}

		// Create a copy of nodeList so as not to modify an object passed by reference
		localNodeList = Array.prototype.slice.call(localNodeList);

		for (var i = 0; i < localNodeList.length; i++) {
			if (callback.call(localNodeList[i], i) === false) {
				return;
			}
		}
	}

	/**
	 * Convenience function for document.getElementById
	 *
	 * @param id the id
	 * @param [ownerDocument] - The document in which to get the element (uses the current document if none provided)
	 * @return {HTMLElement} the element with this ID, or null if no element exists in the the DOM with this id
	 */
	function getElementById(id, ownerDocument) {
		if (!ownerDocument || ownerDocument.nodeType !== Node.DOCUMENT_NODE) ownerDocument = document;
		return ownerDocument.getElementById(id);
	}

	/**
	 * Convenience function for document.getElementsByClassName
	 *
	 * @param cls the name of a single class
	 * @param {Node} [element] limit the scope of the query to only to descendants of this element (optional)
	 * @return {NodeList} list of all elements matching the class
	 */
	function getElementByClassName(cls, element)
	{
		return _getContext(element).getElementsByClassName(cls);
	}

	/**
	 * Convenience function for document.querySelector and element.querySelector
	 *
	 * @param query the a string containing one or more CSS selectors separated by commas
	 * @param {Node} [element] limit the scope of the query to only to descendants of this element (optional)
	 * @return {Element} the first matching element, or null if no matches are found
	 */
	function querySelector(query, element)
	{
		return _getContext(element).querySelector(query);
	}

	/**
	 * Convenience function for document.querySelectorAll and element.querySelectorAll.
	 *
	 * @param query the a string containing one or more CSS selectors separated by commas
	 * @param {Node} [element] limit the scope of the query to only to descendants of this element (optional)
	 * @return {NodeList} list of all the elements in the document that match
	 */
	function querySelectorAll(query, element)
	{
		return _getContext(element).querySelectorAll(query);
	}

	/**
	 * Appends html (String) to an element. In most cases you can use {@link Element.innerHTML}. This is mostly useful
	 * for cases where the parent element has existing children. This is also useful for document fragments
	 * {@link Document.createDocumentFragment}, as you cannot use innerHTML on a document fragment.
	 *
	 * @param parentElement {Element} the element to which the html should be appended
	 * @param html {String} html to append
	 * @returns {Element|Array.<Element>} a pointer to a single node (if the HTML has only one root / top-level element node)
	 *                                    or a list of pointers to nodes (if the HTML has multiple roots / top-level element nodes)
	 *                                    or an empty list if the html has no root elements (i.e. nothing was appended)
	 */
	function appendHTML(parentElement, html)
	{
		var wrapper = document.createElement("div");
		wrapper.innerHTML = html;

		var rootEl = [];

		while (wrapper.firstChild)
		{
			// append each child of the wrapper element (i.e. the html), but do not append the wrapper element itself
			var el = parentElement.appendChild(wrapper.firstChild);
			if(el.nodeType === Node.ELEMENT_NODE)
			{
				rootEl.push(el);
			}
		}

		return (rootEl.length === 1) ? rootEl[0] : rootEl;
	}

    /**
     * Replaces the html (String) to an element. This is mostly useful
     * for cases where the parent element does not have existing children.
     *
     * @param element {Element} the element in which the html should be replaced
     * @param html {String} html to replace with
     */

    function replaceHTMLContent(element, html)
    {
        if (element && html) {
            element.innerHTML = html;
        }
    }

	/**
	 * Inserts element after elementBefore. elementBefore is expected to be an existing node in the DOM.
	 *
	 * @param element the element to be inserted into the DOM
	 * @param elementBefore an existing DOM element which element should be added after
	 */
	function insertAfter(element, elementBefore)
	{
		// if nextSibling is null then insertBefore will append the new element as the last child of parentNode
		elementBefore.parentNode.insertBefore(element, elementBefore.nextSibling);
	}

	/**
	 * Removes an element in the DOM.
	 *
	 * @param element the element to be removed from the DOM
	 * @return {Node} the element that was removed
	 */
	function removeElement(element)
	{
		return element.parentNode.removeChild(element);
	}

	/**
	 * Inserts html (String) after an element.
	 *
	 * @see {@link Element#insertAdjacentHTML}
	 * @param elementBefore {Element} the element before which the html should inserted
	 * @param html {String} html to append
	 * @returns {Element|Array.<Element>} a pointer to a single node (if the HTML has only one root / top-level element node)
	 *                                    or a list of pointers to nodes (if the HTML has multiple roots / top-level element nodes)
	 *                                    or an empty list if the html has no root elements (i.e. nothing was appended)
	 */
	function insertHTMLBefore(elementBefore, html)
	{
		var wrapper = document.createElement("div");
		wrapper.innerHTML = html;

		var rootEl = [];

		while (wrapper.firstChild)
		{
			// insert each child of the wrapper element (i.e. the html), but do not append the wrapper element itself
			var el = elementBefore.parentNode.insertBefore(wrapper.firstChild, elementBefore);
			if(el.nodeType === Node.ELEMENT_NODE)
			{
				rootEl.push(el);
			}
		}

		return (rootEl.length === 1) ? rootEl[0] : rootEl;
	}

	/**
	 * Add one or more classes to the element
	 *
	 * @param element the element to which the classes should be added
	 * @param cls the class(es) to add (whitespace separated)
	 */
	function addClass(element, cls)
	{
		var classesToAdd = cls.split(WHITE_SPACE_REGEX);
		for (var loop = classesToAdd.length; loop--;)
		{
			// Shame we can't seem to call .apply on a native method!
			element.classList.add(classesToAdd[loop]);
		}
	}

	/**
	 * Remove one or more classes from the element
	 *
	 * @param element the element from which the classes should be removed
	 * @param cls the class(es) to remove (whitespace separated)
	 */
	function removeClass(element, cls)
	{
		var classesToRemove = cls.split(WHITE_SPACE_REGEX);
		for (var loop = classesToRemove.length; loop--;)
		{
			// Shame we can't seem to call .apply on a native method!
			element.classList.remove(classesToRemove[loop]);
		}
	}

	/**
	 * Toggles the presence of one or more classes on the element
	 *
	 * @param element the element on which the classes should be toggled
	 * @param cls the class(es) to add (whitespace separated)
	 */
	function toggleClass(element, cls)
	{
		var classesToToggle = cls.split(WHITE_SPACE_REGEX);
		for (var loop = classesToToggle.length; loop--;) {
			element.classList.toggle(classesToToggle[loop]);
		}
	}

	/**
	 * Returns whether an element has the specified class
	 *
	 * @param element the element to test
	 * @param cls the class to test for. NOTE: ONLY ONE CLASS IS SUPPORTED
	 */
	function hasClass(element, cls)
	{
		return element.classList.contains(cls);
	}

	/**
	 * Reads the current value set for a given style property on an element
	 *
	 * @param element the element to which the style is applied
	 * @param property the property whose value should be returned
	 * @return {String} the value set for the style property
	 */
	function getStyle(element, property)
	{
		// Fx will not correctly get the style if the "property" argument contains a hyphen (e.g. "margin-left"). It requires the hyphens to be
		// removed, and the succeeding letter to be converted to uppercase. Chrome and IE aren't as fussy, and work fine with hyphenated styles
		var styles = window.getComputedStyle(element, null);
		return styles[fromHyphenDelimitedToCamelCase(property)];
	}

	/**
	 * Set a style on an element
	 *
	 * @param element the element to style
	 * @param property the property to modify
	 * @param value the new value
	 */
	function setStyle(element, property, value)
	{
		_setStyle(element, property, value)
	}

	/**
	 * Returns the width of an element, including padding, but excluding borders and margins
	 * 19/05/2014 - Renamed from "getWidth", which was not really descriptive of which width was being returned...
	 *
	 * @param element the element for which the width should be obtained
	 * @return {Number} the current width of element
	 */
	function getWidthWithPadding(element) {
		return element.clientWidth;
	}

	/**
	 * Returns the width of an element, including padding and borders, but excluding margins
	 *
	 * @param element the element for which the width should be obtained
	 * @return {Number} the current width of element
	 */
	function getWidthWithBorders(element) {
		return element.offsetWidth;
	}

	/**
	 * Returns the width of an element, including padding, borders, and margins
	 *
	 * @param element the element for which the width should be obtained
	 * @return {Number} the current width of element
	 */
	function getWidthWithMargins(element) {
		var leftMargin = parseInt(DOMUtils.getStyle(element, 'margin-left'), 10);
		var rightMargin = parseInt(DOMUtils.getStyle(element, 'margin-right'), 10);
		return element.offsetWidth + leftMargin + rightMargin;
	}

	/**
	 * Returns the width of an element, excluding borders, padding, and margins
	 *
	 * @param element the element for which the width should be determined
	 * @return {Number} the current width of the element
	 */
	function getAvailableWidth(element) {
		var widthToExclude = 0;
		widthToExclude += _removePixelUnit(getStyle(element, 'paddingLeft'));
		widthToExclude += _removePixelUnit(getStyle(element, 'paddingRight'));
		return (getWidthWithPadding(element) - widthToExclude);
	}

	/**
	 * Set the width of the element (margins, padding and borders will be preserved)
	 *
	 * @param element the element for which the width should be changed
	 * @param width the new width value
	 */
	function setWidth(element, width)
	{
		_setStyle(element, 'width', _appendPixelUnit(width));
	}

	/**
	 * Mirror setting the "transform: translateX / translateY / translateZ styles in JavaScript without having to worry about vendor prefixes
	 * If the value for any axis is undefined or null, no translation is performed on that axis
	 * @param element {HTMLElement} the element to which the translation should be applied
	 * @param x {Number|undefined|null} The amount to translate on the X-axis
	 * @param y {Number|undefined|null} The amount to translate on the Y-axis
	 * @param z {Number|undefined|null} The amount to translate on the Z-axis
	 */
	function translate(element, x, y, z) {
		var translationArr = [];
		if (isDefined(x)) translationArr.push('translateX(' + _appendPixelUnit(x) + ')');
		if (isDefined(y)) translationArr.push('translateY(' + _appendPixelUnit(y) + ')');
		if (isDefined(z)) translationArr.push('translateZ(' + _appendPixelUnit(z) + ')');
		var translationStr = translationArr.join(' ');
		element.style.transform = translationStr;
		element.style[Utils.getJSVendorPrefix() + 'Transform'] = translationStr;
	}

	/**
	 * As DOMUtils.translate, but all 3 values (x, y, and z) have to be specified, and it uses an explicit 3d translate.
	 * @param element {HTMLElement} the element to which the translation should be applied
	 * @param x {Number} The amount to translate on the X-axis
	 * @param y {Number} The amount to translate on the Y-axis
	 * @param z {Number} The amount to translate on the Z-axis
	 */
	function translate3d(element, x, y, z) {
		var translationStr ='translate3d(' + _appendPixelUnit(x) + ', ' + _appendPixelUnit(y) + ', ' + _appendPixelUnit(z) + ')';
		element.style.transform = translationStr;
		element.style[Utils.getJSVendorPrefix() + 'Transform'] = translationStr;
	}

	/**
	 * Sets up a transition on a transform property, taking into account browser vendor prefixes
	 * Assumes the duration is in milliseconds
	 * @param element The element to which the transform transition should be applied
	 * @param duration The duration (in milliseconds) over which the transition should apply
	 * @param easing The easing method (e.g. "linear")
	 */
	function transitionTransform(element, duration, easing) {
		var transitionStyle = getTransitionStyle();

		// Only works for webkit prefixes and un-prefixed... but AFAIK, that's all we need at the moment
		var transitionProperty = 'transform';
		if (/webkit/.test(transitionStyle)) transitionProperty = '-webkit-transform';

		var transitionValue = transitionProperty + ' ' + duration + 'ms ' + easing;
		DOMUtils.setStyle(element, transitionStyle, transitionValue);
	}


	/**
	 * Returns the height of the browser window
	 *
	 * References: http://www.w3schools.com/js/js_window.asp
	 *
	 * @return {Number} the current height of the browser window
	 */
	function getClientHeight() {
		return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	}

	/**
	 * Returns the width of the browser window
	 *
	 * References: http://www.w3schools.com/js/js_window.asp
	 *
	 * @return {Number} the current width of the browser window
	 */
	function getClientWidth() {
		return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	}

	/**
	 * Returns the height of an element, including padding, but excluding borders and margins
	 * 01/08/2014 - Renamed from "getHeight", which was not really descriptive of which height was being returned...
	 *
	 * @param element the element for which the height should be determined
	 * @return {Number} the current height of element
	 */
	function getHeightWithPadding(element) {
		return element.clientHeight;
	}

	/**
	 * Returns the height of an element, including padding and borders, but excluding margins
	 *
	 * @param element the element for which the height should be obtained
	 * @return {Number} the current height of element
	 */
	function getHeightWithBorders(element) {
		return element.offsetHeight;
	}

	/**
	 * Returns the height of an element, including padding, borders, and margins
	 *
	 * @param element the element for which the height should be obtained
	 * @return {Number} the current height of element
	 */
	function getHeightWithMargins(element) {
		var topMargin = parseInt(DOMUtils.getStyle(element, 'margin-top'), 10);
		var bottomMargin = parseInt(DOMUtils.getStyle(element, 'margin-bottom'), 10);
		return element.offsetHeight + topMargin + bottomMargin;
	}

	/**
	 * Returns the height of an element, excluding borders, padding, and margins
	 *
	 * @param element the element for which the height should be determined
	 * @return {Number} the current height of the element
	 */
	function getAvailableHeight(element)
	{
		var heightToExclude = 0;
		heightToExclude += _removePixelUnit(getStyle(element, 'paddingBottom'));
		heightToExclude += _removePixelUnit(getStyle(element, 'paddingTop'));
		return (getHeightWithPadding(element) - heightToExclude);
	}

	/**
	 * Set the height of the element (margins, padding and borders will be preserved)
	 *
	 * @param element the element for which the height should be changed
	 * @param height the new height value
	 */
	function setHeight(element, height)
	{
		_setStyle(element, 'height', _appendPixelUnit(height));
	}

	/**
	 * Returns the left offset coordinate for the element (i.e. relative the left of the viewport)
	 * 
	 * @see {@link http://ejohn.org/blog/getboundingclientrect-is-awesome/}
	 * @param element
	 */
	function getOffsetTop(element)
	{
		return element.getBoundingClientRect().top;
	}

	/**
	 * Returns the top offset coordinate for the element (i.e. relative the left of the viewport)
	 * 
	 * @see {@link http://ejohn.org/blog/getboundingclientrect-is-awesome/}
	 * @param element
	 */
	function getOffsetLeft(element)
	{
		return element.getBoundingClientRect().left;
	}

	/**
	 * Returns the left offset coordinate for the element relative to its parent
	 *
	 *
	 * @param element
	 */
	function getOffsetLeftParentRelative(element)
	{
		return element.offsetLeft;
	}

	/**
	 * Shows an element. In practice this sets the value of the display css property to block. This may not in all cases
	 * be sufficient to show the element (i.e. if a parent element is hidden, !important used in CSS).
	 * @param element {Element} the element to show
	 * @param [displayStyleToUse=block] {string} the display style to use. Defaults to 'block', but can be overridden (e.g. with 'webkit-flex', etc)
	 */
	function show(element, displayStyleToUse)
	{
		displayStyleToUse = displayStyleToUse || 'block';
		_setStyle(element, 'display', displayStyleToUse);
	}

	/**
	 * Hides an element. In practice this sets the value of the display css property to none. This may not in all cases
	 * be sufficient to hide the element (i.e !important used in CSS).
	 *
	 * @param element {Element} the element to hide
	 */
	function hide(element)
	{
		_setStyle(element, 'display', 'none');
	}

	/**
	 * Sets the visibility of an element so that it should be visible. The element will not show if any of its ancestor
	 * elements are not visible, or if its display style has been set to 'none'.
	 *
	 * NOTE: ==> Unless you specifically need to alter the 'visibility' style, chances are you will want to use the 'show' method instead <==
	 *
	 * @param element the element to make visible
	 */
	function visible(element)
	{
		_setStyle(element, 'visibility', 'visible');
	}

	/**
	 * Sets the visibility of an element so that it should be invisible.
	 *
	 * NOTE: ==> Unless you specifically need to alter the 'visibility' style, chances are you will want to use the 'hide' method instead <==
	 *
	 * @param element the element to make invisible
	 */
	function invisible(element)
	{
		_setStyle(element, 'visibility', 'hidden');
	}

	/**
	 * Sets element opacity
	 * @param element
	 * @param opacity value
	 */

	function setOpacity(element, value)
	{
		_setStyle(element, 'opacity', value);
	}

    /**
    * Returns true if the element is hidden using display: 'none'
    *
    * @param element the element to check
    * @returns {boolean}
    */
    function isHidden(element) {
        return (getStyle(element, 'display') === 'none');
    }

	/**
    * Returns true if the element is invisible using visibility: 'hidden'
    *
    * @param element the element to check
    * @returns {boolean}
    */
    function isInvisible(element) {
        return (getStyle(element, 'visibility') === 'hidden');
    }

	/**
	 * Returns true if elToCheck is contained within elThatMightBeContainer (that is, elThatMightBeContainer is either
	 * the parent or an ancestor of elToCheck)
	 *
	 * @param {HTMLElement} elToCheck - The element to check is contained within elThatMightBeContainer
	 * @param {HTMLElement} elThatMightBeContainer - The element to check is the parent or ancestor of elToCheck
	 * @returns {boolean}
	 */
	function isElementContainedWithin(elToCheck, elThatMightBeContainer) {
		// Odd - if I remove the "Number" typecast, 16 !== 16 (at least in desktop Chrome v36.0.1941.0 dev-m). Go figure!
		return (Number(elThatMightBeContainer.compareDocumentPosition(elToCheck) & Node.DOCUMENT_POSITION_CONTAINED_BY) === Node.DOCUMENT_POSITION_CONTAINED_BY);
	}


	/**
	 * Occasionally, there will be a mismatch between what the DOM thinks the browser should render, and
	 * what it is actually rendering. In these cases, poking the DOM can help.
	 *
	 * I've found that updating MOST styles on an element fixes this, but the change has to be to a style that
	 * doesn't affect the way the element is displayed.
	 *
	 * In most cases, toggling the element's "clear" style between "left" and "right" (it defaults to "none") seems
	 * to work, as it's a style we don't use that much.
	 *
	 * For cases when the clear style can't be used, the two optional parameters "styleToPoke" and "valueToUse"
	 * can be provided. If not provided, the "clear" style will be alternated between "left" and "right".
	 *
	 * @param {HTMLElement} elToPoke - The element to poke
	 * @param {String} [styleToPoke] - (Optionally) a style to poke
	 * @param {String|Number} [valueToUse] - (Optionally) a value to put in the style
	 */
	function pokeDOM(elToPoke, styleToPoke, valueToUse) {
		if (arguments.length === 3) {
			// Specific styles have been provided, use them
			DOMUtils.setStyle(elToPoke, styleToPoke, valueToUse);
		} else {
			// Alternate the "clear" style between "left" and "right"
			var elClearStyle = DOMUtils.getStyle(elToPoke, 'clear');
			if (elClearStyle === 'left') {
				elClearStyle = 'right';
			} else {
				elClearStyle = 'left';
			}
			DOMUtils.setStyle(elToPoke, 'clear', elClearStyle);
		}
	}


	/**
	 * Generates an event and fires (dispatches) it on a particular element
	 *
	 * @param element the element on which the event is fired (dispatched)
	 * @param eventType the type of event to fire (dispatch)
	 */
	function dispatch(element, eventType)
	{
		//noinspection JSClosureCompilerSyntax
		var event = new Event(eventType);
		element.dispatchEvent(event);
	}

	/**
	 * Attaches a one time event listener to the element (i.e. the listener is removed after the event has fired once)
	 * NOTE: If you wish to remove the event listener, you have to remove the wrapped listener function that is returned, and
	 * NOT the listener you pass in. Trying to remove the listener you pass in will have no effect as it is a different function
	 *
	 * @param element the element on which the event is fired (dispatched)
	 * @param eventType the type of event
	 * @param listener the function to call when this event occurs
	 * @returns {Function} The listener function wrapper (useful for passing into a call to removeEventListener)
	 */
	function addOnce(element, eventType, listener)
	{
		var listenerWrapper = function(event)
		{
			listener.call(this, event);
			element.removeEventListener(eventType, listenerWrapper, false);
		};

		element.addEventListener(eventType, listenerWrapper, false);
		return listenerWrapper;
	}

	/**
	 * Determines the context for the querySelector function call i.e. should the search be limited to descendants of a
	 * single element or should it cover the whole document.
	 *
	 * @param element the element
	 * @return {Object} the object on which to invoke querySelector or querySelectorAll (either an element or the document)
	 * @private
	 */
	function _getContext(element)
	{
		return (element instanceof Element) ? element : document;
	}

	/**
	 * Helper for setting a style on an element
	 *
	 * @param element the element to style
	 * @param property the property to modify
	 * @param value the new value
	 * @private
	 */
	function _setStyle(element, property, value)
	{
		// Fx will not correctly set the style if the "property" argument contains a hyphen (e.g. "margin-left"). It requires the hyphens to be
		// removed, and the succeeding letter to be converted to uppercase. Chrome and IE aren't as fussy, and work fine with hyphenated styles
		element.style[fromHyphenDelimitedToCamelCase(property)] = value;
	}

	/**
	 * Appends 'px' to value. Will only occur if value is a Number.
	 *
	 * @param value the value to which 'px' should be appended
	 * @return the value, with px appended if it is a number
	 * @private
	 */
	function _appendPixelUnit(value)
	{
		if(typeof(value) === typeof(0))
		{
			value += "px";
		}
		return value;
	}

	function _removePixelUnit(value)
	{
		return parseInt(value, 10);
	}

	/**
	 * Use to find the closest parent element using  cLass
	 * @param {HTMLElement}  element
	 * @param {String} cls parent class
	 * @return {HTMLElement}
	 */

	function closest (element, cls)
	{
		while ((element = element.parentElement) && !element.classList.contains(cls));
		return element;
	}

	/**
	 * Public or exposed methods
	 */
	// namedEvent values are considered spelling errors
	//noinspection SpellCheckingInspection
	return {
		/**
		 * Helper to loop through a NodeList
		 */
		loop: loop,
		/**
		 * Helpers for finding DOM elements and performing DOM manipulation
		 */
		id: getElementById,
		cls: getElementByClassName,
		qs: querySelector,
		qsa: querySelectorAll,
		appendHTML: appendHTML,
        replaceHTMLContent: replaceHTMLContent,
        removeElement: removeElement,
		insertAfter: insertAfter,
		insertHTMLBefore: insertHTMLBefore,
		closest : closest,
		/**
		 * Helpers for accessing and mutating styles
		 */
		addClass: addClass,
		removeClass: removeClass,
		toggleClass: toggleClass,
		hasClass: hasClass,
		getStyle: getStyle,
		setStyle: setStyle,
		getAvailableWidth: getAvailableWidth,
		getWidthWithPadding: getWidthWithPadding,
		getWidthWithBorders: getWidthWithBorders,
		getWidthWithMargins: getWidthWithMargins,
		setWidth: setWidth,
		translate: translate,
		translate3d: translate3d,
		transitionTransform: transitionTransform,
		getClientHeight: getClientHeight,
		getClientWidth: getClientWidth,
		getHeightWithPadding: getHeightWithPadding,
		getHeightWithBorders: getHeightWithBorders,
		getHeightWithMargins: getHeightWithMargins,
		getAvailableHeight: getAvailableHeight,
		setHeight: setHeight,
		getOffsetTop: getOffsetTop, 
		getOffsetLeft: getOffsetLeft,
		getOffsetLeftParentRelative: getOffsetLeftParentRelative,
		show: show,
		hide: hide,
		visible: visible,
		invisible: invisible,
		isHidden: isHidden,
		isInvisible: isInvisible,
		isElementContainedWithin: isElementContainedWithin,
		pokeDOM: pokeDOM,
		setOpacity:setOpacity,

		/**
		 * Helpers for DOM events
 		 */
		dispatch : dispatch,
		addOnce : addOnce,
		namedEvent : {
			BLUR : 'blur',
			CHANGE : 'change',
			CLICK : 'click',
			FOCUS : 'focus',
			HASH_CHANGE : 'hashchange',
			INPUT : 'input',
			KEY_DOWN : 'keydown',
			KEY_PRESS : 'keypress',
			KEY_UP : 'keyup',
			MOUSE_DOWN: 'mousedown',
			MOUSE_ENTER : 'mouseenter',
			MOUSE_LEAVE : 'mouseleave',
			MOUSE_MOVE : 'mousemove',
			MOUSE_OUT : 'mouseout',
			MOUSE_OVER : 'mouseover',
			MOUSE_UP : 'mouseup',
			RESIZE : 'resize',
			SUBMIT : 'submit',
			TOUCH_CANCEL : 'touchcancel',
			TOUCH_END : 'touchend',
			TOUCH_ENTER : 'touchenter',
			TOUCH_LEAVE : 'touchleave',
			TOUCH_MOVE : 'touchmove',
			TOUCH_START : 'touchstart',
			TRANSITION_END : 'transitionend',
			SCROLL : 'scroll'
		}
	};
})();
