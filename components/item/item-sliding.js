import { ChangeDetectionStrategy, Component, ContentChildren, ContentChild, Directive, ElementRef, EventEmitter, Input, Optional, Output, Renderer, ViewEncapsulation, NgZone } from '@angular/core';
import { CSS, nativeRaf, nativeTimeout, clearNativeTimeout } from '../../util/dom';
import { Item } from './item';
import { isPresent, swipeShouldReset } from '../../util/util';
import { List } from '../list/list';
var SWIPE_MARGIN = 30;
var ELASTIC_FACTOR = 0.55;
export var ItemOptions = (function () {
    function ItemOptions(_elementRef, _renderer) {
        this._elementRef = _elementRef;
        this._renderer = _renderer;
        this.ionSwipe = new EventEmitter();
    }
    ItemOptions.prototype.getSides = function () {
        if (isPresent(this.side) && this.side === 'left') {
            return 1;
        }
        else {
            return 2;
        }
    };
    ItemOptions.prototype.width = function () {
        return this._elementRef.nativeElement.offsetWidth;
    };
    ItemOptions.decorators = [
        { type: Directive, args: [{
                    selector: 'ion-item-options',
                },] },
    ];
    ItemOptions.ctorParameters = [
        { type: ElementRef, },
        { type: Renderer, },
    ];
    ItemOptions.propDecorators = {
        'side': [{ type: Input },],
        'ionSwipe': [{ type: Output },],
    };
    return ItemOptions;
}());
export var ItemSliding = (function () {
    function ItemSliding(list, _renderer, _elementRef, _zone) {
        this._renderer = _renderer;
        this._elementRef = _elementRef;
        this._zone = _zone;
        this._openAmount = 0;
        this._startX = 0;
        this._optsWidthRightSide = 0;
        this._optsWidthLeftSide = 0;
        this._timer = null;
        this._optsDirty = true;
        this._state = 2;
        this.ionDrag = new EventEmitter();
        list && list.containsSlidingItem(true);
        _elementRef.nativeElement.$ionComponent = this;
        this.setElementClass('item-wrapper', true);
    }
    Object.defineProperty(ItemSliding.prototype, "_itemOptions", {
        set: function (itemOptions) {
            var sides = 0;
            for (var _i = 0, _a = itemOptions.toArray(); _i < _a.length; _i++) {
                var item = _a[_i];
                var side = item.getSides();
                if (side === 1) {
                    this._leftOptions = item;
                }
                else {
                    this._rightOptions = item;
                }
                sides |= item.getSides();
            }
            this._optsDirty = true;
            this._sides = sides;
        },
        enumerable: true,
        configurable: true
    });
    ItemSliding.prototype.getOpenAmount = function () {
        return this._openAmount;
    };
    ItemSliding.prototype.getSlidingPercent = function () {
        var openAmount = this._openAmount;
        if (openAmount > 0) {
            return openAmount / this._optsWidthRightSide;
        }
        else if (openAmount < 0) {
            return openAmount / this._optsWidthLeftSide;
        }
        else {
            return 0;
        }
    };
    ItemSliding.prototype.startSliding = function (startX) {
        if (this._timer) {
            clearNativeTimeout(this._timer);
            this._timer = null;
        }
        if (this._openAmount === 0) {
            this._optsDirty = true;
            this._setState(4);
        }
        this._startX = startX + this._openAmount;
        this.item.setElementStyle(CSS.transition, 'none');
    };
    ItemSliding.prototype.moveSliding = function (x) {
        if (this._optsDirty) {
            this.calculateOptsWidth();
            return;
        }
        var openAmount = (this._startX - x);
        switch (this._sides) {
            case 2:
                openAmount = Math.max(0, openAmount);
                break;
            case 1:
                openAmount = Math.min(0, openAmount);
                break;
            case 3: break;
            default:
                (void 0);
                break;
        }
        if (openAmount > this._optsWidthRightSide) {
            var optsWidth = this._optsWidthRightSide;
            openAmount = optsWidth + (openAmount - optsWidth) * ELASTIC_FACTOR;
        }
        else if (openAmount < -this._optsWidthLeftSide) {
            var optsWidth = -this._optsWidthLeftSide;
            openAmount = optsWidth + (openAmount - optsWidth) * ELASTIC_FACTOR;
        }
        this._setOpenAmount(openAmount, false);
        return openAmount;
    };
    ItemSliding.prototype.endSliding = function (velocity) {
        var restingPoint = (this._openAmount > 0)
            ? this._optsWidthRightSide
            : -this._optsWidthLeftSide;
        var isResetDirection = (this._openAmount > 0) === !(velocity < 0);
        var isMovingFast = Math.abs(velocity) > 0.3;
        var isOnCloseZone = Math.abs(this._openAmount) < Math.abs(restingPoint / 2);
        if (swipeShouldReset(isResetDirection, isMovingFast, isOnCloseZone)) {
            restingPoint = 0;
        }
        this._setOpenAmount(restingPoint, true);
        this.fireSwipeEvent();
        return restingPoint;
    };
    ItemSliding.prototype.fireSwipeEvent = function () {
        var _this = this;
        if (this._state & 32) {
            this._zone.run(function () { return _this._rightOptions.ionSwipe.emit(_this); });
        }
        else if (this._state & 64) {
            this._zone.run(function () { return _this._leftOptions.ionSwipe.emit(_this); });
        }
    };
    ItemSliding.prototype.calculateOptsWidth = function () {
        var _this = this;
        nativeRaf(function () {
            if (!_this._optsDirty) {
                return;
            }
            _this._optsWidthRightSide = 0;
            if (_this._rightOptions) {
                _this._optsWidthRightSide = _this._rightOptions.width();
                (void 0);
            }
            _this._optsWidthLeftSide = 0;
            if (_this._leftOptions) {
                _this._optsWidthLeftSide = _this._leftOptions.width();
                (void 0);
            }
            _this._optsDirty = false;
        });
    };
    ItemSliding.prototype._setOpenAmount = function (openAmount, isFinal) {
        var _this = this;
        if (this._timer) {
            clearNativeTimeout(this._timer);
            this._timer = null;
        }
        this._openAmount = openAmount;
        if (isFinal) {
            this.item.setElementStyle(CSS.transition, '');
        }
        else {
            if (openAmount > 0) {
                var state = (openAmount >= (this._optsWidthRightSide + SWIPE_MARGIN))
                    ? 8 | 32
                    : 8;
                this._setState(state);
            }
            else if (openAmount < 0) {
                var state = (openAmount <= (-this._optsWidthLeftSide - SWIPE_MARGIN))
                    ? 16 | 64
                    : 16;
                this._setState(state);
            }
        }
        if (openAmount === 0) {
            this._timer = nativeTimeout(function () {
                _this._setState(2);
                _this._timer = null;
            }, 600);
            this.item.setElementStyle(CSS.transform, '');
            return;
        }
        this.item.setElementStyle(CSS.transform, "translate3d(" + -openAmount + "px,0,0)");
        var ionDrag = this.ionDrag;
        if (ionDrag.observers.length > 0) {
            this._zone.run(ionDrag.emit.bind(ionDrag, this));
        }
    };
    ItemSliding.prototype._setState = function (state) {
        if (state === this._state) {
            return;
        }
        this.setElementClass('active-slide', (state !== 2));
        this.setElementClass('active-options-right', !!(state & 8));
        this.setElementClass('active-options-left', !!(state & 16));
        this.setElementClass('active-swipe-right', !!(state & 32));
        this.setElementClass('active-swipe-left', !!(state & 64));
        this._state = state;
    };
    ItemSliding.prototype.close = function () {
        this._setOpenAmount(0, true);
    };
    ItemSliding.prototype.setElementClass = function (cssClass, shouldAdd) {
        this._renderer.setElementClass(this._elementRef.nativeElement, cssClass, shouldAdd);
    };
    ItemSliding.decorators = [
        { type: Component, args: [{
                    selector: 'ion-item-sliding',
                    template: "\n    <ng-content select=\"ion-item,[ion-item]\"></ng-content>\n    <ng-content select=\"ion-item-options\"></ng-content>\n  ",
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    encapsulation: ViewEncapsulation.None
                },] },
    ];
    ItemSliding.ctorParameters = [
        { type: List, decorators: [{ type: Optional },] },
        { type: Renderer, },
        { type: ElementRef, },
        { type: NgZone, },
    ];
    ItemSliding.propDecorators = {
        'item': [{ type: ContentChild, args: [Item,] },],
        'ionDrag': [{ type: Output },],
        '_itemOptions': [{ type: ContentChildren, args: [ItemOptions,] },],
    };
    return ItemSliding;
}());
//# sourceMappingURL=item-sliding.js.map