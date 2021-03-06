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
export class Menu {
    constructor(_menuCtrl, _elementRef, _config, _platform, _renderer, _keyboard, _zone, _gestureCtrl) {
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
    get enabled() {
        return this._isEnabled;
    }
    set enabled(val) {
        this._isEnabled = isTrueProperty(val);
        this._setListeners();
    }
    get swipeEnabled() {
        return this._isSwipeEnabled;
    }
    set swipeEnabled(val) {
        this._isSwipeEnabled = isTrueProperty(val);
        this._setListeners();
    }
    get persistent() {
        return this._isPers;
    }
    set persistent(val) {
        this._isPers = isTrueProperty(val);
    }
    ngOnInit() {
        this._init = true;
        let content = this.content;
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
        let hasEnabledSameSideMenu = this._menuCtrl.getMenus().some(m => {
            return m.side === this.side && m.enabled;
        });
        if (hasEnabledSameSideMenu) {
            this._isEnabled = false;
        }
        this._setListeners();
        this._cntEle.classList.add('menu-content');
        this._cntEle.classList.add('menu-content-' + this.type);
        this._menuCtrl.register(this);
    }
    onBackdropClick(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this._menuCtrl.close();
        return false;
    }
    _setListeners() {
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
    }
    _getType() {
        if (!this._type) {
            this._type = MenuController.create(this.type, this, this._platform);
            if (this._config.get('animate') === false) {
                this._type.ani.duration(0);
            }
        }
        return this._type;
    }
    setOpen(shouldOpen, animated = true) {
        if ((shouldOpen && this.isOpen) || !this._isEnabled || this._isAnimating) {
            return Promise.resolve(this.isOpen);
        }
        this._before();
        return new Promise(resolve => {
            this._getType().setOpen(shouldOpen, animated, () => {
                this._after(shouldOpen);
                resolve(this.isOpen);
            });
        });
    }
    canSwipe() {
        return this._isEnabled && this._isSwipeEnabled && !this._isAnimating;
    }
    swipeStart() {
        if (this.canSwipe()) {
            this._before();
            this._getType().setProgressStart(this.isOpen);
        }
    }
    swipeProgress(stepValue) {
        if (!this._isAnimating) {
            return;
        }
        this._getType().setProgessStep(stepValue);
        let ionDrag = this.ionDrag;
        if (ionDrag.observers.length > 0) {
            this._zone.run(ionDrag.emit.bind(ionDrag, stepValue));
        }
    }
    swipeEnd(shouldCompleteLeft, shouldCompleteRight, stepValue) {
        if (!this._isAnimating) {
            return;
        }
        let opening = !this.isOpen;
        let shouldComplete = false;
        if (opening) {
            shouldComplete = (this.side === 'right') ? shouldCompleteLeft : shouldCompleteRight;
        }
        else {
            shouldComplete = (this.side === 'right') ? shouldCompleteRight : shouldCompleteLeft;
        }
        this._getType().setProgressEnd(shouldComplete, stepValue, (isOpen) => {
            (void 0);
            this._after(isOpen);
        });
    }
    _before() {
        (void 0);
        this.menuContent && this.menuContent.resize();
        this.setElementClass('show-menu', true);
        this.backdrop.setElementClass('show-backdrop', true);
        this._keyboard.close();
        this._isAnimating = true;
    }
    _after(isOpen) {
        (void 0);
        this.isOpen = isOpen;
        this._isAnimating = false;
        this._events.unlistenAll();
        if (isOpen) {
            this._gestureCtrl.disableGesture('goback-swipe', this._gestureID);
            this._cntEle.classList.add('menu-content-open');
            let callback = this.onBackdropClick.bind(this);
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
    }
    open() {
        return this.setOpen(true);
    }
    close() {
        return this.setOpen(false);
    }
    toggle() {
        return this.setOpen(!this.isOpen);
    }
    enable(shouldEnable) {
        this.enabled = shouldEnable;
        if (!shouldEnable && this.isOpen) {
            this.close();
        }
        if (shouldEnable) {
            this._menuCtrl.getMenus()
                .filter(m => m.side === this.side && m !== this)
                .map(m => m.enabled = false);
        }
        return this;
    }
    swipeEnable(shouldEnable) {
        this.swipeEnabled = shouldEnable;
        return this;
    }
    getNativeElement() {
        return this._elementRef.nativeElement;
    }
    getMenuElement() {
        return this.getNativeElement().querySelector('.menu-inner');
    }
    getContentElement() {
        return this._cntEle;
    }
    getBackdropElement() {
        return this.backdrop.getNativeElement();
    }
    width() {
        return this.getMenuElement().offsetWidth;
    }
    getMenuController() {
        return this._menuCtrl;
    }
    setElementClass(className, add) {
        this._renderer.setElementClass(this._elementRef.nativeElement, className, add);
    }
    setElementAttribute(attributeName, value) {
        this._renderer.setElementAttribute(this._elementRef.nativeElement, attributeName, value);
    }
    ngOnDestroy() {
        this._menuCtrl.unregister(this);
        this._events.unlistenAll();
        this._cntGesture && this._cntGesture.destroy();
        this._type && this._type.destroy();
        this._cntGesture = null;
        this._type = null;
        this._cntEle = null;
    }
}
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
//# sourceMappingURL=menu.js.map