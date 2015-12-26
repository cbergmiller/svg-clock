/*
 * SVG-Clock
 * Christian Bergmiller 2015
 */

Clock = function(dom, opts) {
	this.dom = dom;
	opts = opts || {};
	this.size = opts.size || 400;
	this._render();
	this.changeTimezone( opts.timezone );
};

Clock.prototype = {
	_secondHand: null,
	_minuteHand: null,
	_hourHand: null,
	_isInitialized: false,
	_intervalId: null,

	_template: function() {
		var s = '<svg width="SIZE" height="SIZE" viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg" version="1.1">\
					<defs>\
						<radialGradient id="clock-dial-reflex" gradientUnits="objectBoundingBox" cx="0.5" cy="-0.4" r="1.8">\
							<stop offset="0.3" stop-color="rgba(255, 255, 255, 1)" />\
							<stop offset="0.6" stop-color="rgba(240, 240, 240, 1)" />\
						</radialGradient>\
					</defs>\
					<circle cx="0.5" cy="0.5" r="0.48" fill="url(#clock-dial-reflex)" stroke="rgba(200, 200, 200, 1)" stroke-width="0.006" />\
					<circle cx="0.5" cy="0.5" r="0.028" fill="black" stroke="none" />\
					<g class="clock-dial"></g>\
					<g class="clock-hand-minute" transform="rotate(0, 0.5, 0.5)"></g>\
					<g class="clock-hand-hour" transform="rotate(0, 0.5, 0.5)"></g>\
					<circle cx="0.5" cy="0.5" r="0.018" fill="red" stroke="none" />\
					<g class="clock-hand-second" transform="rotate(0, 0.5, 0.5)"></g>\
				</svg>';
		return s.replace(/SIZE/g, this.size.toString())
	},

	start: function() {
		if (!this._intervalId) {
			this._intervalId = setInterval( this._updateClock.bind(this), 1000 )
		}
	},

	stop: function() {
		if (this._intervalId) {
			clearInterval(this._intervalId);
			this._intervalId = null;
		}
	},

	/**
	 * Change the timezone.
	 * @param timezone string
	 */
	changeTimezone: function(timezone) {
		if (timezone && typeof moment != "undefined" && typeof moment.tz != "undefined") {
			this.timezone = timezone;
			this.now = this._nowMoment;
		}
		else this.now = this._nowDefault;
		if (this._isInitialized) this._updateClock();
	},

	_nowDefault: function() {
		var now = new Date();
		return {
			hours: now.getHours() + ( now.getMinutes() / 60 ),
			minutes: now.getMinutes(),
			seconds: now.getSeconds()
		};
	},

	_nowMoment: function() {
		var now = moment().tz(this.timezone);
		return {
			hours: now.hour() + ( now.minute() / 60 ),
			minutes: now.minute(),
			seconds: now.second()
		};
	},

	_updateClock: function () {
		var now;

		now = this.now();
		this._transformHand( this._secondHand, now.seconds * 6 );
		this._transformHand( this._minuteHand, now.minutes * 6 );
		this._transformHand( this._hourHand, (now.hours%12) * 30 );
	},

	_transformHand: function(transform, angle) {
		transform.setAttributeNS( null, "transform", "rotate(" + angle + ",0.5,0.5)" );
	},

	_render: function() {
		this.dom.innerHTML = this._template();

		var dial = this.dom.getElementsByClassName("clock-dial")[0],
			width;
		// outer dia ticks
		var outerDia = 0.48,
			r = outerDia * 0.98,
			r2;

		for (var step=0; step<60; step++) {
			var rad = step * 6 / 360 * 2 * Math.PI,
				sin = Math.sin(rad),
				cos = Math.cos(rad);

			if (!(step%15)) {
				// inner dia 15 min ticks
				r2 = outerDia * 0.76;
				width = 0.028;
			} else if ( (!(step%5)) && (step%15) ) {
				// inner dia 5 min ticks
				r2 = outerDia * 0.83;
				width = 0.020;
			} else {
				// inner dia 1 min ticks
				r2 = outerDia * 0.90;
				width = 0.012;
			}
			dial.appendChild( this._createLine(0.5+r*sin, 0.5+r*cos, 0.5+r2*sin, 0.5+r2*cos, width) );
		}

		// create minute hand
		this._minuteHand = this.dom.getElementsByClassName("clock-hand-minute")[0];
		this._createHand( this._minuteHand, 0.012, 0.94, 0.2, 0.026, outerDia );

		// create hour hand
		this._hourHand = this.dom.getElementsByClassName("clock-hand-hour")[0];
		this._createHand( this._hourHand, 0.019, 0.7, 0, 0.03, outerDia );

		// create second hand
		this._secondHand = this.dom.getElementsByClassName("clock-hand-second")[0];
		this._createCounterweightHand( this._secondHand, 0.006, 0.97, 0.2, 0.4, 0.0024, outerDia );

		this._isInitialized = true;
	},

	_createHand: function(dom, width, length, stubLength, pointLength, outerDia) {
		dom.appendChild(
			this._createPath("black", [
				[0.5 - width, 0.5 + outerDia * stubLength],
				[0.5 + width, 0.5 + outerDia * stubLength],
				[0.5 + width, 0.5 - outerDia * length + pointLength],
				[0.5, 0.5 - outerDia * length],
				[0.5 - width, 0.5 - outerDia * length + pointLength],
				[0.5 - width, outerDia * (0.5 + outerDia * stubLength)]
			])
		);

	},

	_createCounterweightHand: function(dom, width, length, stubLength, pointLength, pointWidth, outerDia) {
		dom.appendChild(
			this._createPath("red", [
				[0.5 - width, 0.5 + outerDia * stubLength],
				[0.5 + width, 0.5 + outerDia * stubLength],
				[0.5 + width, 0.5 - outerDia * length + pointLength],
				[0.5 + pointWidth, 0.5 - outerDia * length],
				[0.5 - pointWidth, 0.5 - outerDia * length],
				[0.5 - width, 0.5 - outerDia * length + pointLength],
				[0.5 - width, outerDia * (0.5 + outerDia * stubLength)]
			])
		);
		dom.appendChild(
			this._createEllipse(0.5, 0.5 + outerDia * stubLength, 0.011, 0.036)
		);
	},

	// create SVG line
	_createLine: function(x1, y1, x2, y2, width) {
		var line;

		line = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line.setAttributeNS(null, "x1", x1 );
		line.setAttributeNS(null, "y1", y1 );
		line.setAttributeNS(null, "x2", x2 );
		line.setAttributeNS(null, "y2", y2 );
		line.setAttributeNS(null, "stroke-width", width);
		line.setAttributeNS(null, "stroke", "rgba(0, 0, 0, 1)");
		return line
	},

	// create SVG ellipse
	_createEllipse: function(cx, cy, rx, ry) {
		var eps = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
		eps.setAttributeNS(null, "fill", "red" );
		eps.setAttributeNS(null, "stroke", "none" );
		eps.setAttributeNS(null, "stroke-width", "0" );
		eps.setAttributeNS(null, "cx", cx );
		eps.setAttributeNS(null, "cy", cy );
		eps.setAttributeNS(null, "rx", rx );
		eps.setAttributeNS(null, "ry", ry );
		return eps
	},

	// create SVG path
	_createPath: function(color, d) {
		var path,
			s = '';

		path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttributeNS(null, "fill", color );
		path.setAttributeNS(null, "stroke", "none" );
		for (var i=0; i<d.length; i++) {
			s += (!i?"M":" L") + d[i][0] + "," + d[i][1];
		}
		path.setAttributeNS(null, "d", s);
		return path
	}

};

/*
 * Register jQuery Plugin (if jQuery is present).
 */
if (typeof jQuery != "undefined") {
	jQuery.fn.clock = function(arg1, arg2) {
		return this.each(function() {
			var plugin = $.data( this, 'plugin_clock' );
			if ( !(plugin instanceof Clock) ) {
				$.data( this, 'plugin_clock', new Clock( this, arg1 ) );
			} else if ( arg1 == 'changeTimezone' ) {
				plugin.changeTimezone(arg2);
			} else if ( arg1 == 'start' ) {
				plugin.start();
			} else if ( arg1 == 'stop' ) {
				plugin.stop();
			}
		})
	};
}
