import { ChangeDetectionStrategy, Component, ContentChild, ElementRef, EventEmitter, Input, NgZone, Output, Renderer, ViewChild, ViewEncapsulation } from '@angular/core';
import { Backdrop } from '../backdrop/backdrop';
import { Config } from '../../config/config';
import { isTrueProperty } from '../../util/util';
import { Keyboard } from '../../util/keyboard';
import { MenuContentGesture } from './menu-gestures';
import { MenuController } from './menu-controller';
import { Platform } from '../../platform/platform';
import { GestureController } from '../../gestures/gesture-controller';
import { UIEventManager } from '../../util/ui-event-manager';
import { Content } from '../content/content';
export var Menu = (function () {
    function Menu(_menuCtrl, _elementRef, _config, _platform, _renderer, _keyboard, _zone, _gestureCtrl) {
        this._menuCtrl = _menuCtrl;
        this._elementRef = _elementRef;
        this._config = _config;
        this._platform = _platform;
        this._renderer = _renderer;
        this._keyboard = _keyboard;
        this._zone = _zone;
        this._gestureCtrl = _gestureCtrl;
        this._isEnabled = true;
        this._isSwipeEnabled = true;
        this._isAnimating = false;
        this._isPers = false;
        this._init = false;
        this._events = new UIEventManager();
        this._gestureID = 0;
        this.isOpen = false;
        this.ionDrag = new EventEmitter();
        this.ionOpen = new EventEmitter();
        this.ionClose = new EventEmitter();
        if (_gestureCtrl) {
            this._gestureID = _gestureCtrl.newID();
        }
    }
    Object.defineProperty(Menu.prototype, "enabled", {
        get: function () {
            return this._isEnabled;
        },
        set: function (val) {
            this._isEnabled = isTrueProperty(val);
            this._setListeners();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Menu.prototype, "swipeEnabled", {
        get: function () {
            return this._isSwipeEnabled;
        },
        set: function (val) {
            this._isSwipeEnabled = isTrueProperty(val);
            this._setListeners();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Menu.prototype, "persistent", {
        get: function () {
            return this._isPers;
        },
        set: function (val) {
            this._isPers = isTrueProperty(val);
        },
        enumerable: true,
        configurable: true
    });
    Menu.prototype.ngOnInit = function () {
        var _this = this;
        this._init = true;
        var content = this.content;
        this._cntEle = (content instanceof Node) ? content : content && content.getNativeElement && content.getNativeElement();
        if (!this._cntEle) {
            return console.error('Menu: must have a [content] element to listen for drag events on. Example:\n\n<ion-menu [content]="content"></ion-menu>\n\n<ion-nav #content></ion-nav>');
        }
        if (this.side !== 'left' && this.side !== 'right') {
            this.side = 'left';
        }
        this.setElementAttribute('side', this.side);
        if (!this.type) {
            this.type = this._config.get('menuType');
        }
        this.setElementAttribute('type', this.type);
        this._cntGesture = new MenuContentGesture(this, document.body, this._gestureCtrl);
        var hasEnabledSameSideMenu = this._menuCtrl.getMenus().some(function (m) {
            return m.side === _this.side && m.enabled;
        });
        if (hasEnabledSameSideMenu) {
            this._isEnabled = false;
        }
        this._setListeners();
        this._cntEle.classList.add('menu-content');
        this._cntEle.classList.add('menu-content-' + this.type);
        this._menuCtrl.register(this);
    };
    Menu.prototype.onBackdropClick = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this._menuCtrl.close();
        return false;
    };
    Menu.prototype._setListeners = function () {
        if (!this._init) {
            return;
        }
        if (this._isEnabled && this._isSwipeEnabled && !this._cntGesture.isListening) {
            (void 0);
            this._cntGesture.listen();
        }
        else if (this._cntGesture.isListening && (!this._isEnabled || !this._isSwipeEnabled)) {
            (void 0);
            this._cntGesture.unlisten();
        }
    };
    Menu.prototype._getType = function () {
        if (!this._type) {
            this._type = MenuController.create(this.type, this, this._platform);
            if (this._config.get('animate') === false) {
                this._type.ani.duration(0);
            }
        }
        return this._type;
    };
    Menu.prototype.setOpen = function (shouldOpen, animated) {
        var _this = this;
        if (animated === void 0) { animated = true; }
        if ((shouldOpen && this.isOpen) || !this._isEnabled || this._isAnimating) {
            return Promise.resolve(this.isOpen);
        }
        this._before();
        return new Promise(function (resolve) {
            _this._getType().setOpen(shouldOpen, animated, function () {
                _this._after(shouldOpen);
                resolve(_this.isOpen);
            });
        });
    };
    Menu.prototype.canSwipe = function () {
        return this._isEnabled && this._isSwipeEnabled && !this._isAnimating;
    };
    Menu.prototype.swipeStart = function () {
        if (this.canSwipe()) {
            this._before();
            this._getType().setProgressStart(this.isOpen);
        }
    };
    Menu.prototype.swipeProgress = function (stepValue) {
        if (!this._isAnimating) {
            return;
        }
        this._getType().setProgessStep(stepValue);
        var ionDrag = this.ionDrag;
        if (ionDrag.observers.length > 0) {
            this._zone.run(ionDrag.emit.bind(ionDrag, stepValue));
        }
    };
    Menu.prototype.swipeEnd = function (shouldCompleteLeft, shouldCompleteRight, stepValue) {
        var _this = this;
        if (!this._isAnimating) {
            return;
        }
        var opening = !this.isOpen;
        var shouldComplete = false;
        if (opening) {
            shouldComplete = (this.side === 'right') ? shouldCompleteLeft : shouldCompleteRight;
        }
        else {
            shouldComplete = (this.side === 'right') ? shouldCompleteRight : shouldCompleteLeft;
        }
        this._getType().setProgressEnd(shouldComplete, stepValue, function (isOpen) {
            (void 0);
            _this._after(isOpen);
        });
    };
    Menu.prototype._before = function () {
        (void 0);
        this.menuContent && this.menuContent.resize();
        this.setElementClass('show-menu', true);
        this.backdrop.setElementClass('show-backdrop', true);
        this._keyboard.close();
        this._isAnimating = true;
    };
    Menu.prototype._after = function (isOpen) {
        (void 0);
        this.isOpen = isOpen;
        this._isAnimating = false;
        this._events.unlistenAll();
        if (isOpen) {
            this._gestureCtrl.disableGesture('goback-swipe', this._gestureID);
            this._cntEle.classList.add('menu-content-open');
            var callback = this.onBackdropClick.bind(this);
            this._events.pointerEvents({
                element: this._cntEle,
                pointerDown: callback
            });
            this._events.pointerEvents({
                element: this.backdrop.getNativeElement(),
                pointerDown: callback
            });
            this.ionOpen.emit(true);
        }
        else {
            this._gestureCtrl.enableGesture('goback-swipe', this._gestureID);
            this._cntEle.classList.remove('menu-content-open');
            this.setElementClass('show-menu', false);
            this.backdrop.setElementClass('show-menu', false);
            this.ionClose.emit(true);
        }
    };
    Menu.prototype.open = function () {
        return this.setOpen(true);
    };
    Menu.prototype.close = function () {
        return this.setOpen(false);
    };
    Menu.prototype.toggle = function () {
        return this.setOpen(!this.isOpen);
    };
    Menu.prototype.enable = function (shouldEnable) {
        var _this = this;
        this.enabled = shouldEnable;
        if (!shouldEnable && this.isOpen) {
            this.close();
        }
        if (shouldEnable) {
            this._menuCtrl.getMenus()
                .filter(function (m) { return m.side === _this.side && m !== _this; })
                .map(function (m) { return m.enabled = false; });
        }
        return this;
    };
    Menu.prototype.swipeEnable = function (shouldEnable) {
        this.swipeEnabled = shouldEnable;
        return this;
    };
    Menu.prototype.getNativeElement = function () {
        return this._elementRef.nativeElement;
    };
    Menu.prototype.getMenuElement = function () {
        return this.getNativeElement().querySelector('.menu-inner');
    };
    Menu.prototype.getContentElement = function () {
        return this._cntEle;
    };
    Menu.prototype.getBackdropElement = function () {
        return this.backdrop.getNativeElement();
    };
    Menu.prototype.width = function () {
        return this.getMenuElement().offsetWidth;
    };
    Menu.prototype.getMenuController = function () {
        return this._menuCtrl;
    };
    Menu.prototype.setElementClass = function (className, add) {
        this._renderer.setElementClass(this._elementRef.nativeElement, className, add);
    };
    Menu.prototype.setElementAttribute = function (attributeName, value) {
        this._renderer.setElementAttribute(this._elementRef.nativeElement, attributeName, value);
    };
    Menu.prototype.ngOnDestroy = function () {
        this._menuCtrl.unregister(this);
        this._events.unlistenAll();
        this._cntGesture && this._cntGesture.destroy();
        this._type && this._type.destroy();
        this._cntGesture = null;
        this._type = null;
        this._cntEle = null;
    };
    Menu.decorators = [
        { type: Component, args: [{
                    selector: 'ion-menu',
                    template: '<div class="menu-inner"><ng-content></ng-content></div>' +
                        '<ion-backdrop disableScroll="false"></ion-backdrop>',
                    host: {
                        'role': 'navigation'
                    },
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    encapsulation: ViewEncapsulation.None,
                },] },
    ];
    Menu.ctorParameters = [
        { type: MenuController, },
        { type: ElementRef, },
        { type: Config, },
        { type: Platform, },
        { type: Renderer, },
        { type: Keyboard, },
        { type: NgZone, },
        { type: GestureController, },
    ];
    Menu.propDecorators = {
        'backdrop': [{ type: ViewChild, args: [Backdrop,] },],
        'menuContent': [{ type: ContentChild, args: [Content,] },],
        'content': [{ type: Input },],
        'id': [{ type: Input },],
        'side': [{ type: Input },],
        'type': [{ type: Input },],
        'enabled': [{ type: Input },],
        'swipeEnabled': [{ type: Input },],
        'persistent': [{ type: Input },],
        'maxEdgeStart': [{ type: Input },],
        'ionDrag': [{ type: Output },],
        'ionOpen': [{ type: Output },],
        'ionClose': [{ type: Output },],
    };
    return Menu;
}());
//# sourceMappingURL=menu.js.map