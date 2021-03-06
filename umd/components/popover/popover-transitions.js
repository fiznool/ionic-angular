var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", '../../animations/animation', '../../util/dom', '../../transitions/page-transition'], factory);
    }
})(function (require, exports) {
    "use strict";
    var animation_1 = require('../../animations/animation');
    var dom_1 = require('../../util/dom');
    var page_transition_1 = require('../../transitions/page-transition');
    var PopoverTransition = (function (_super) {
        __extends(PopoverTransition, _super);
        function PopoverTransition() {
            _super.apply(this, arguments);
        }
        PopoverTransition.prototype.mdPositionView = function (nativeEle, ev) {
            var originY = 'top';
            var originX = 'left';
            var popoverWrapperEle = nativeEle.querySelector('.popover-wrapper');
            var popoverEle = nativeEle.querySelector('.popover-content');
            var popoverDim = popoverEle.getBoundingClientRect();
            var popoverWidth = popoverDim.width;
            var popoverHeight = popoverDim.height;
            var bodyWidth = window.innerWidth;
            var bodyHeight = window.innerHeight;
            var targetDim = ev && ev.target && ev.target.getBoundingClientRect();
            var targetTop = (targetDim && 'top' in targetDim) ? targetDim.top : (bodyHeight / 2) - (popoverHeight / 2);
            var targetLeft = (targetDim && 'left' in targetDim) ? targetDim.left : (bodyWidth / 2) - (popoverWidth / 2);
            var targetHeight = targetDim && targetDim.height || 0;
            var popoverCSS = {
                top: targetTop,
                left: targetLeft
            };
            if (popoverCSS.left < POPOVER_MD_BODY_PADDING) {
                popoverCSS.left = POPOVER_MD_BODY_PADDING;
            }
            else if (popoverWidth + POPOVER_MD_BODY_PADDING + popoverCSS.left > bodyWidth) {
                popoverCSS.left = bodyWidth - popoverWidth - POPOVER_MD_BODY_PADDING;
                originX = 'right';
            }
            if (targetTop + targetHeight + popoverHeight > bodyHeight && targetTop - popoverHeight > 0) {
                popoverCSS.top = targetTop - popoverHeight;
                nativeEle.className = nativeEle.className + ' popover-bottom';
                originY = 'bottom';
            }
            else if (targetTop + targetHeight + popoverHeight > bodyHeight) {
                popoverEle.style.bottom = POPOVER_MD_BODY_PADDING + 'px';
            }
            popoverEle.style.top = popoverCSS.top + 'px';
            popoverEle.style.left = popoverCSS.left + 'px';
            popoverEle.style[dom_1.CSS.transformOrigin] = originY + ' ' + originX;
            popoverWrapperEle.style.opacity = '1';
        };
        PopoverTransition.prototype.iosPositionView = function (nativeEle, ev) {
            var originY = 'top';
            var originX = 'left';
            var popoverWrapperEle = nativeEle.querySelector('.popover-wrapper');
            var popoverEle = nativeEle.querySelector('.popover-content');
            var popoverDim = popoverEle.getBoundingClientRect();
            var popoverWidth = popoverDim.width;
            var popoverHeight = popoverDim.height;
            var bodyWidth = window.innerWidth;
            var bodyHeight = window.innerHeight;
            var targetDim = ev && ev.target && ev.target.getBoundingClientRect();
            var targetTop = (targetDim && 'top' in targetDim) ? targetDim.top : (bodyHeight / 2) - (popoverHeight / 2);
            var targetLeft = (targetDim && 'left' in targetDim) ? targetDim.left : (bodyWidth / 2);
            var targetWidth = targetDim && targetDim.width || 0;
            var targetHeight = targetDim && targetDim.height || 0;
            var arrowEle = nativeEle.querySelector('.popover-arrow');
            var arrowDim = arrowEle.getBoundingClientRect();
            var arrowWidth = arrowDim.width;
            var arrowHeight = arrowDim.height;
            if (!targetDim) {
                arrowEle.style.display = 'none';
            }
            var arrowCSS = {
                top: targetTop + targetHeight,
                left: targetLeft + (targetWidth / 2) - (arrowWidth / 2)
            };
            var popoverCSS = {
                top: targetTop + targetHeight + (arrowHeight - 1),
                left: targetLeft + (targetWidth / 2) - (popoverWidth / 2)
            };
            if (popoverCSS.left < POPOVER_IOS_BODY_PADDING) {
                popoverCSS.left = POPOVER_IOS_BODY_PADDING;
            }
            else if (popoverWidth + POPOVER_IOS_BODY_PADDING + popoverCSS.left > bodyWidth) {
                popoverCSS.left = bodyWidth - popoverWidth - POPOVER_IOS_BODY_PADDING;
                originX = 'right';
            }
            if (targetTop + targetHeight + popoverHeight > bodyHeight && targetTop - popoverHeight > 0) {
                arrowCSS.top = targetTop - (arrowHeight + 1);
                popoverCSS.top = targetTop - popoverHeight - (arrowHeight - 1);
                nativeEle.className = nativeEle.className + ' popover-bottom';
                originY = 'bottom';
            }
            else if (targetTop + targetHeight + popoverHeight > bodyHeight) {
                popoverEle.style.bottom = POPOVER_IOS_BODY_PADDING + '%';
            }
            arrowEle.style.top = arrowCSS.top + 'px';
            arrowEle.style.left = arrowCSS.left + 'px';
            popoverEle.style.top = popoverCSS.top + 'px';
            popoverEle.style.left = popoverCSS.left + 'px';
            popoverEle.style[dom_1.CSS.transformOrigin] = originY + ' ' + originX;
            popoverWrapperEle.style.opacity = '1';
        };
        return PopoverTransition;
    }(page_transition_1.PageTransition));
    exports.PopoverTransition = PopoverTransition;
    var PopoverPopIn = (function (_super) {
        __extends(PopoverPopIn, _super);
        function PopoverPopIn() {
            _super.apply(this, arguments);
        }
        PopoverPopIn.prototype.init = function () {
            var ele = this.enteringView.pageRef().nativeElement;
            var backdrop = new animation_1.Animation(ele.querySelector('ion-backdrop'));
            var wrapper = new animation_1.Animation(ele.querySelector('.popover-wrapper'));
            wrapper.fromTo('opacity', 0.01, 1);
            backdrop.fromTo('opacity', 0.01, 0.08);
            this
                .easing('ease')
                .duration(100)
                .add(backdrop)
                .add(wrapper);
        };
        PopoverPopIn.prototype.play = function () {
            var _this = this;
            dom_1.nativeRaf(function () {
                _this.iosPositionView(_this.enteringView.pageRef().nativeElement, _this.opts.ev);
                _super.prototype.play.call(_this);
            });
        };
        return PopoverPopIn;
    }(PopoverTransition));
    exports.PopoverPopIn = PopoverPopIn;
    var PopoverPopOut = (function (_super) {
        __extends(PopoverPopOut, _super);
        function PopoverPopOut() {
            _super.apply(this, arguments);
        }
        PopoverPopOut.prototype.init = function () {
            var ele = this.leavingView.pageRef().nativeElement;
            var backdrop = new animation_1.Animation(ele.querySelector('ion-backdrop'));
            var wrapper = new animation_1.Animation(ele.querySelector('.popover-wrapper'));
            wrapper.fromTo('opacity', 0.99, 0);
            backdrop.fromTo('opacity', 0.08, 0);
            this
                .easing('ease')
                .duration(500)
                .add(backdrop)
                .add(wrapper);
        };
        return PopoverPopOut;
    }(PopoverTransition));
    exports.PopoverPopOut = PopoverPopOut;
    var PopoverMdPopIn = (function (_super) {
        __extends(PopoverMdPopIn, _super);
        function PopoverMdPopIn() {
            _super.apply(this, arguments);
        }
        PopoverMdPopIn.prototype.init = function () {
            var ele = this.enteringView.pageRef().nativeElement;
            var content = new animation_1.Animation(ele.querySelector('.popover-content'));
            var viewport = new animation_1.Animation(ele.querySelector('.popover-viewport'));
            content.fromTo('scale', 0.001, 1);
            viewport.fromTo('opacity', 0.01, 1);
            this
                .easing('cubic-bezier(0.36,0.66,0.04,1)')
                .duration(300)
                .add(content)
                .add(viewport);
        };
        PopoverMdPopIn.prototype.play = function () {
            var _this = this;
            dom_1.nativeRaf(function () {
                _this.mdPositionView(_this.enteringView.pageRef().nativeElement, _this.opts.ev);
                _super.prototype.play.call(_this);
            });
        };
        return PopoverMdPopIn;
    }(PopoverTransition));
    exports.PopoverMdPopIn = PopoverMdPopIn;
    var PopoverMdPopOut = (function (_super) {
        __extends(PopoverMdPopOut, _super);
        function PopoverMdPopOut() {
            _super.apply(this, arguments);
        }
        PopoverMdPopOut.prototype.init = function () {
            var ele = this.leavingView.pageRef().nativeElement;
            var wrapper = new animation_1.Animation(ele.querySelector('.popover-wrapper'));
            wrapper.fromTo('opacity', 0.99, 0);
            this
                .easing('ease')
                .duration(500)
                .fromTo('opacity', 0.01, 1)
                .add(wrapper);
        };
        return PopoverMdPopOut;
    }(PopoverTransition));
    exports.PopoverMdPopOut = PopoverMdPopOut;
    var POPOVER_IOS_BODY_PADDING = 2;
    var POPOVER_MD_BODY_PADDING = 12;
});
//# sourceMappingURL=popover-transitions.js.map