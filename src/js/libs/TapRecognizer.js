/**
 * Create a tap recogniser
 *
 * @author Tomasz Szarstuk
 * @version 14.5.0
 * @since 14.1.0
 *
 * @param {Element} element the element upon which taps should be recognised
 * @param {Function} handler the function to handle a tap
 * @param {Object} [scope] the scope from which to call the function
 * @param {Boolean} [stopPropagation=true] prevent propagation when the mouse end/touch end event registers
 * @param {Boolean} [useCapture=false] add the event handler on the capture phase. If you don't know what this means, don't pass Boolean(true)!
 * @constructor
 */
var TapRecognizer = function(element, handler, scope, stopPropagation, useCapture) {
	this._el = element;
	this._handler = handler;
	this._scope = scope;
	this._stopPropagation = (typeof(stopPropagation) !== typeof(undefined)) ? stopPropagation : true;
	this._useCapture = useCapture === true;

	this._timer = null;

	if (element) {
		TapRecognizer.handledEvents.forEach(function(event) {
			element.addEventListener(event, this, this._useCapture);
		}, this);
	}
};


TapRecognizer._suppressMouseDownUp = false;


TapRecognizer.prototype.destroy = function() {
	TapRecognizer.handledEvents.forEach(function(event) {
		this._el.removeEventListener(event, this, this._useCapture);
	}, this);
	delete this._el;
	delete this._handler;
	delete this._scope;
};


/**
 * Return the button element
 * @return {*}
 */
TapRecognizer.prototype.element = function() {
	return this._el;
};


TapRecognizer.handledEvents = [DOMUtils.namedEvent.TOUCH_END, DOMUtils.namedEvent.TOUCH_MOVE, DOMUtils.namedEvent.TOUCH_START, DOMUtils.namedEvent.CLICK, DOMUtils.namedEvent.MOUSE_DOWN, DOMUtils.namedEvent.MOUSE_UP];


TapRecognizer.prototype.handleEvent = function(event) {
	if (this._el.disabled) return;

	// #60612 - prevent multiple touchstart events from triggering
	if (event.type === DOMUtils.namedEvent.TOUCH_START && event.touches.length > 1) return;

	switch (event.type) {
		case DOMUtils.namedEvent.MOUSE_DOWN:
		case DOMUtils.namedEvent.TOUCH_START:
			if (event.type == DOMUtils.namedEvent.TOUCH_START) {
				TapRecognizer._suppressMouseDownUp = true;
			} else if (event.type == DOMUtils.namedEvent.MOUSE_DOWN && TapRecognizer._suppressMouseDownUp) {
				return;
			}

			this._pointerDown = true;
			this._onPointerDown(event);
			break;

		case DOMUtils.namedEvent.MOUSE_MOVE:
		case DOMUtils.namedEvent.TOUCH_MOVE:
			this._pointerDown = true;
			this._onPointerMove(event);
			break;

		case DOMUtils.namedEvent.MOUSE_UP:
		case DOMUtils.namedEvent.TOUCH_END:
			if (event.type == DOMUtils.namedEvent.TOUCH_END) {
				TapRecognizer._suppressMouseDownUp = true;
			} else if (event.type == DOMUtils.namedEvent.MOUSE_UP && TapRecognizer._suppressMouseDownUp) {
				return;
			}

			if (this._pointerDown) {
				this._pointerDown = false;
				this._onPointerUp(event);
				if (this._analyticsData) this._analyticsData.analyse();
			}
			break;

		case DOMUtils.namedEvent.TOUCH_CANCEL:
			this._pointerDown = false;
			this._cancel();
			break;

		case DOMUtils.namedEvent.CLICK:
			if (this._pointerDown && TapRecognizer._suppressMouseDownUp === false) {
				this._pointerDown = false;
				this._onPointerUp(event);
			}
			// reset suppression flag for a device that fire Touch and Click events inconsistently (Galaxy Note 10.1 2012 edition)
			TapRecognizer._suppressMouseDownUp = false;
			break;
	}
};

/**
 * @param analyticsData AnalyticsData object
 */
TapRecognizer.prototype.setAnalyticsData = function(analyticsData){
	this._analyticsData = analyticsData;
};


/**
 * Extract x, and y position from pointer event
 * @private
 */
TapRecognizer.prototype._getPointerPosition = function(event) {
	var pointer = event;
	if (!pointer.clientX) {
		pointer = event.touches[0];
	}
	return {
		x: pointer.clientX,
		y: pointer.clientY
	};
};


TapRecognizer.prototype._onPointerDown = function(event) {
	// Ignore any but first pointer in a sequence
	if (this._timer) {
		return;
	}
	this._position = this._getPointerPosition(event);
	this._timer = setTimeout(this._onTimeout.bind(this), 300);
};


TapRecognizer.prototype._onPointerMove = function(event) {
	var position, offsetX, offsetY;
	if (this._timer) {
		position = this._getPointerPosition(event);
		offsetX = this._position.x - position.x;
		offsetY = this._position.y - position.y;
		if (offsetX * offsetX + offsetY * offsetY > 400) {
			this._cancel();
		}
	}
};


TapRecognizer.prototype._onPointerUp = function(event) {
	if (this._timer) {
		this._cancel();

		if (isEnumerableProperty(event, 'which') && event.which === 3) {
			// suppress handling of a mouse up event from a contextual (right) click
			return;
		}

		event.preventDefault();
		if (this._stopPropagation) {
			event.stopPropagation();
		}

		if (typeof this._handler === 'string') {
			this._scope[this._handler](event);
		} else {
			this._handler.call(this._scope, event);
		}
	}
};


TapRecognizer.prototype._onTimeout = function() {
	this._timer = null;
};


TapRecognizer.prototype._cancel = function() {
	if (this._timer) {
		clearTimeout(this._timer);
		this._timer = null;
	}
};


TapRecognizer.prototype.changeHandler = function(handler, scope) {
	this._handler = handler;
	if (typeof scope !== 'undefined') {
		this._scope = scope;
	}
};


TapRecognizer.prototype.enableButton = function(enabled) {
	//this._notifyDeprecated('TapRecognizer.enable should not be called. Enabling/disabling button should be responsibility of your view');
	this._el.disabled = enabled ? "" : "disabled";
};

