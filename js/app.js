(function(window){
		var EventUtil = (function (){
			var _addEvent = function(ele, type, func, capture){
				if (window.addEventListener) {
					ele.addEventListener(type, func, capture || false);
					return;
				}else if (window.attachEvent) {
					ele.attachEvent("on"+type, func, capture || false);
					return;
				}else {
					ele["on"+type] = func;
				}
			}

			var _addClass = function(ele, classNames) {
				for (var i = 0, l = classNames.length;i < l; i++) {
					ele.classList.add(classNames[i]);
				};
			}

			var _removeClass = function(ele, classNames) {
				for (var i = 0, l = classNames.length;i < l; i++) {
					ele.classList.remove(classNames[i]);
				};
			}
			
			return {
				addEvent: _addEvent,
				addClass: _addClass,
				removeClass: _removeClass,
				extend: extend
			}
		})();

		window.EventUtil = EventUtil;
	
		var Orientation = function(selector, o) {
			this.selector = selector;
			this.xk = o.xk;
			this.yk = o.yk;
			this.maxMargin = (getValue(GetCurrentStyle(this.selector, "width"))-window.screen.availWidth)/2;

			this.init.call(this, null);
	    }
	    Orientation.prototype.init = function(){
	    	
	        window.addEventListener('deviceorientation', this.orientationListener.bind(this));
	        window.addEventListener('MozOrientation', this.orientationListener.bind(this));
	        window.addEventListener('devicemotion', this.orientationListener.bind(this));
	    }
	    Orientation.prototype.orientationListener = function(evt) {
				// For FF3.6+
			if (!evt.gamma && !evt.beta) {
			// angle=radian*180.0/PI 在firefox中x和y是弧度值,
				evt.gamma = (evt.x * (180 / Math.PI)); //转换成角度值,
				evt.beta = (evt.y * (180 / Math.PI)); //转换成角度值
				evt.alpha = (evt.z * (180 / Math.PI)); //转换成角度值
			}
			/* beta:  -180..180 (rotation around x axis) */
			/* gamma:  -90..90  (rotation around y axis) */
			/* alpha:    0..360 (rotation around z axis) (-180..180) */

			var gamma = evt.gamma;
			var beta = evt.beta;
			var alpha = evt.alpha;

			if(evt.accelerationIncludingGravity){
			// window.removeEventListener('deviceorientation', this.orientationListener, false);
				gamma = event.accelerationIncludingGravity.x*10
				beta = -event.accelerationIncludingGravity.y*10
				alpha = event.accelerationIncludingGravity.z*10
			}

			if (this._lastGamma != gamma || this._lastBeta != beta) { 
				if (Math.abs(this.maxMargin) >= Math.abs(gamma/90 * 150)) {
					this.selector.style.marginLeft = gamma/90 * 150 * this.xk +"px";
				};

				this.selector.style.marginTop = beta/90 * 60 * this.yk +"px";

				this._lastGamma = gamma;
				this._lastBeta = beta;
			}
	    };
	    window.Orientation = Orientation;
	

		window.TouchEvent = (function(EventUtil, navigator) {
			var _touch = isNotPC(),
				Start = _touch ? "touchstart" : "mousedown",
				End = _touch ? "touchend" : "mouseup",
				Move = _touch ? "touchmove" : "mousemove",
				mainDiv,
				TouchHandler = {};

			function isNotPC() {
				var userAgentInfo = navigator.userAgent; 
				var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"); 
				var flag = false; 
				for (var v = 0; v < Agents.length; v++) { 
					if (userAgentInfo.indexOf(Agents[v]) > 0) { 
						flag = true; 
						break;
					}
				}
				return flag;
			};
			function fixTouch(e) {
				var touch = _touch ? e.touches[0] : e;
				var winPageX = window.pageXOffset,
					winPageY = window.pageYOffset,
					x = touch.clientX,
					y = touch.clientY;

				if (touch.pageY === 0 && Math.floor(y) > Math.floor(touch.pageY) ||
					touch.pageX === 0 && Math.floor(x) > Math.floor(touch.pageX)) {
					x = x - winPageX;
					y = y - winPageY;
				} else if (y < (touch.pageY - winPageY) || x < (touch.pageX - winPageX) ) {
					x = touch.pageX - winPageX;
					y = touch.pageY - winPageY;
				}
				return extend(touch,{
					clientX:    x,
					clientY:    y,
					preventDefault: e.preventDefault
				});
			};

			function init (){
				var x1, x2, y1, y2;
				var $touch;
				var isMove = false;

				mainDiv.addEventListener(Start, function (e) {
					e = window.event || e;
					e.preventDefault();
					$touch = fixTouch(e);

					x1 = $touch.clientX;
					y1 = $touch.clientY;
				}, true);

				mainDiv.addEventListener(Move, function (e) {
					e = window.event || e;
					// e.preventDefault();
						
					var touch = fixTouch(e);
					x2 = touch.clientX;
					y2 = touch.clientY;

					isMove = true;

					$touch["type"] = "TouchMove";
					TouchHandler["move"] && TouchHandler["move"].call(mainDiv, $touch);
				}, true);

				mainDiv.addEventListener(End, function (e) {
					if(Math.abs(x1-x2) < 50 && Math.abs(y1-y2) < 50) {
						isMove = false;
					}

					if (isMove) {
						if (Math.abs(x1-x2) > Math.abs(y1-y2)) {
							//left or right
							if ((x1-x2) < -100) { //right
								isMove = false;
								
								$touch["type"] = "TouchRight";

								TouchHandler["right"] && TouchHandler["right"].call(mainDiv, $touch);
							}
							else if((x1-x2) > 100) { //left
								isMove = false;
								
								$touch["type"] = "TouchLeft";
								TouchHandler["left"] && TouchHandler["left"].call(mainDiv, $touch);
							}
						}
						else {
									// up or down
							if(y1-y2 > 100) { //up
								isMove = false;

								$touch["type"] = "TouchUp";								
								TouchHandler["up"] && TouchHandler["up"].call(mainDiv, $touch);
							}
							else if (y1-y2 < -100){ //down
								isMove = false;

								$touch["type"] = "TouchDown";
								TouchHandler["down"] && TouchHandler["down"].call(mainDiv, $touch);
							}
						}
					}else {
						$touch["type"] = "TouchTap";
						TouchHandler["tap"] && TouchHandler["tap"].call(mainDiv, $touch);
					}
				}, true);
			}
			return {
				bindElement: function(ele) {
					mainDiv = ele;
					init();
					return this;
				},
				registerHandler: function(type, func) {
					TouchHandler[type] = func;
					return this;
				},
				touchRight: function(func) {
					return this.registerHandler("right", func);
				},
				touchLeft: function(func) {
					return this.registerHandler("left", func);
				},
				touchUp: function(func) {
					return this.registerHandler("up", func);
				},
				touchDown: function(func) {
					return this.registerHandler("down", func);
				},
				tap: function (func) {
					return this.registerHandler("tap", func);
				}
			}
		})(EventUtil, navigator);

		var getPx = function (value) {
			return (value+"px").toString();
		}
		var getValue = function (string) {
			return /\d+/.exec(string);
		}
		function extend(target, src) {
			for( var d in src) {
				if (src.hasOwnProperty(d)) {
					target[d] = src[d];
				}
			}
			return target;
		}
		function GetCurrentStyle (obj, prop) {     
		    if (obj.currentStyle) {        
		        return obj.currentStyle[prop];     
		    }      
		    else if (window.getComputedStyle) {        
		        propprop = prop.replace (/([A-Z])/g, "-$1");           
		        propprop = prop.toLowerCase ();        
		        return document.defaultView.getComputedStyle(obj,null)[prop];     
		    }      
		    return null;   
		}

		var HerizonSwitch = function (ele, config){
			var back = ele,
				childrenDiv = back.getElementsByClassName("main"),
				_config = extend({
					switchIndex: 0,
					moveTime: 1,
					moveDistence: window.screen.availWidth,
					shake: 0.3
				}, config),
				nowSwitchIndex = _config.switchIndex;

				for(var i = childrenDiv.length-1;i > -1;i--){
					childrenDiv[i].style.left = getPx(i*_config.moveDistence);
				}

				extend(back.style, {
					width: GetCurrentStyle(back, "width"),
					height: GetCurrentStyle(back, "height"),
					overflow: "visible",
					marginLeft: getPx(-nowSwitchIndex*_config.moveDistence),
					webkitTransition: "all "+_config.moveTime+"s cubic-bezier(.36,.84,.36,.84)"
				});

			var _switchIndex = function (index, callback) {
				var length = childrenDiv.length
				if (index >= length) {
					nowSwitchIndex = length-1;
					return;
				}else if(index < 0){
					nowSwitchIndex = 0;
					return;
				}
				nowSwitchIndex = index;				
				back.style.marginLeft = getPx(-nowSwitchIndex*_config.moveDistence);
				if (callback != undefined && callback instanceof Function) {
					callback(nowSwitchIndex);
				};
			}
			_switchIndex(nowSwitchIndex);
			return {
				switchIndex: function(index, callback) {
					_switchIndex(index, callback);
				},
				switchNext: function(callback){
					_switchIndex(nowSwitchIndex+1, callback);
				},
				switchPrev: function(callback){
					_switchIndex(nowSwitchIndex-1, callback);
				}
			}
		};

		window.Switch = (function(h){
			return {
				Herizon: h
			}
		})(HerizonSwitch);
	})(window);
	
	window.onload = function () {
		var $EventUtil = EventUtil,
			_$ = function (id){
				return document.getElementById(id);
			};
		
		var herizonSwitch = new Switch.Herizon(document.querySelector(".background"), {});
		var herizonSwitchFooter = new Switch.Herizon(_$("store"), {});

		TouchEvent.bindElement(document.body).touchLeft(function(e){
			if (e.target.parentNode == document.querySelector(".container")) {
				herizonSwitch.switchNext();
			}else if (e.target.parentNode == document.querySelector(".footer")) {
				herizonSwitchFooter.switchNext();
			}
		}).touchRight(function (e){
			if (e.target.parentNode == document.querySelector(".container")) {
				herizonSwitch.switchPrev();
			}else if (e.target.parentNode == document.querySelector(".footer")) {
				herizonSwitchFooter.switchPrev();
			}
		}).touchUp(function(e){
			if (e.target == _$("infoText")) {
				$EventUtil.extend(_$("infoText").style, {
					marginTop: /\d+/.exec(_$("infoText").style.marginTop)-50 +"px"
				});
				return;
			};
		}).touchDown(function(e){
			if (e.target == _$("infoText")) {

				$EventUtil.extend(_$("infoText").style, {
					marginTop: /\d+/.exec(_$("infoText").style.marginTop)+50 +"px"
				});
				return;
			};
		}).tap(function (e){
			if (e.target == _$("iknow-btn")) {
				window.localStorage.setItem("Where-Father-Go", "come");
				_$("info").style.display = "none";

				$EventUtil.extend(_$("game").style, {
					display: "block",
					opacity: "1"
				});
			}else if (e.target.parentNode == document.querySelector(".header")){
				_$("childhead").style.backgroundImage = "url(img/body/"+e.target.id+".png)";
			}else if (e.target.parentNode.className == "border") {
				var t = (/\D+/.exec(e.target.id))[0];
				if (t == "kuzi") {
					_$("childbody").style.backgroundImage = "url(img/body/child-body-luo.png)";
				};

				_$(t).style.backgroundImage = "url(img/"+t+"/"+e.target.id+".png)";
			}
		});

	    new Orientation(_$("starDiv"), {xk:1,yk:1});
	    new Orientation(_$("leaf"), {xk:1,yk:1});
	    new Orientation(_$("suntext"), {xk: -0.3, yk:-1});

	    window.localStorage.removeItem("Where-Father-Go");

		if (window.localStorage.getItem("Where-Father-Go") == undefined) {
			_$("info").style.display = "block";
			$EventUtil.addClass(_$("info"), ["bounceIn"]);
		}
		else {
			window.localStorage.setItem("Where-Father-Go", "come");
			_$("info").style.display = "none";
			$EventUtil.extend(_$("game").style, {
				display: "block",
				opacity: "1"
			});
		}
	}