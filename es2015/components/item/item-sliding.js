import { ChangeDetectionStrategy, Component, ContentChildren, ContentChild, Directive, ElementRef, EventEmitter, Input, Optional, Output, Renderer, ViewEncapsulation, NgZone } from '@angular/core';
import { CSS, nativeRaf, nativeTimeout, clearNativeTimeout } from '../../util/dom';
import { Item } from './item';
import { isPresent, swipeShouldReset } from '../../util/util';
import { List } from '../list/list';
const SWIPE_MARGIN = 30;
const ELASTIC_FACTOR = 0.55;
export class ItemOptions {
    constructor(_elementRef, _renderer) {
        this._elementRef = _elementRef;
        this._renderer = _renderer;
        this.ionSwipe = new EventEmitter();
    }
    getSides() {
        if (isPresent(this.side) && this.side === 'left') {
            return 1;
        }
        else {
            return 2;
        }
    }
    width() {
        return this._elementRef.nativeElement.offsetWidth;
    }
}
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
export class ItemSliding {
    constructor(list, _renderer, _elementRef, _zone) {
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
    set _itemOptions(itemOptions) {
        let sides = 0;
        for (var item of itemOptions.toArray()) {
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
    }
    getOpenAmount() {
        return this._openAmount;
    }
    getSlidingPercent() {
        let openAmount = this._openAmount;
        if (openAmount > 0) {
            return openAmount / this._optsWidthRightSide;
        }
        else if (openAmount < 0) {
            return openAmount / this._optsWidthLeftSide;
        }
        else {
            return 0;
        }
    }
    startSliding(startX) {
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
    }
    moveSliding(x) {
        if (this._optsDirty) {
            this.calculateOptsWidth();
            return;
        }
        let openAmount = (this._startX - x);
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
    }
    endSliding(velocity) {
        let restingPoint = (this._openAmount > 0)
            ? this._optsWidthRightSide
            : -this._optsWidthLeftSide;
        let isResetDirection = (this._openAmount > 0) === !(velocity < 0);
        let isMovingFast = Math.abs(velocity) > 0.3;
        let isOnCloseZone = Math.abs(this._openAmount) < Math.abs(restingPoint / 2);
        if (swipeShouldReset(isResetDirection, isMovingFast, isOnCloseZone)) {
            restingPoint = 0;
        }
        this._setOpenAmount(restingPoint, true);
        this.fireSwipeEvent();
        return restingPoint;
    }
    fireSwipeEvent() {
        if (this._state & 32) {
            this._zone.run(() => this._rightOptions.ionSwipe.emit(this));
        }
        else if (this._state & 64) {
            this._zone.run(() => this._leftOptions.ionSwipe.emit(this));
        }
    }
    calculateOptsWidth() {
        nativeRaf(() => {
            if (!this._optsDirty) {
                return;
            }
            this._optsWidthRightSide = 0;
            if (this._rightOptions) {
                this._optsWidthRightSide = this._rightOptions.width();
                (void 0);
            }
            this._optsWidthLeftSide = 0;
            if (this._leftOptions) {
                this._optsWidthLeftSide = this._leftOptions.width();
                (void 0);
            }
            this._optsDirty = false;
        });
    }
    _setOpenAmount(openAmount, isFinal) {
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
                let state = (openAmount >= (this._optsWidthRightSide + SWIPE_MARGIN))
                    ? 8 | 32
                    : 8;
                this._setState(state);
            }
            else if (openAmount < 0) {
                let state = (openAmount <= (-this._optsWidthLeftSide - SWIPE_MARGIN))
                    ? 16 | 64
                    : 16;
                this._setState(state);
            }
        }
        if (openAmount === 0) {
            this._timer = nativeTimeout(() => {
                this._setState(2);
                this._timer = null;
            }, 600);
            this.item.setElementStyle(CSS.transform, '');
            return;
        }
        this.item.setElementStyle(CSS.transform, `translate3d(${-openAmount}px,0,0)`);
        let ionDrag = this.ionDrag;
        if (ionDrag.observers.length > 0) {
            this._zone.run(ionDrag.emit.bind(ionDrag, this));
        }
    }
    _setState(state) {
        if (state === this._state) {
            return;
        }
        this.setElementClass('active-slide', (state !== 2));
        this.setElementClass('active-options-right', !!(state & 8));
        this.setElementClass('active-options-left', !!(state & 16));
        this.setElementClass('active-swipe-right', !!(state & 32));
        this.setElementClass('active-swipe-left', !!(state & 64));
        this._state = state;
    }
    close() {
        this._setOpenAmount(0, true);
    }
    setElementClass(cssClass, shouldAdd) {
        this._renderer.setElementClass(this._elementRef.nativeElement, cssClass, shouldAdd);
    }
}
ItemSliding.decorators = [
    { type: Component, args: [{
                selector: 'ion-item-sliding',
                template: `
    <ng-content select="ion-item,[ion-item]"></ng-content>
    <ng-content select="ion-item-options"></ng-content>
  `,
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
//# sourceMappingURL=item-sliding.js.map