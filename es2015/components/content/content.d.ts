import { ElementRef, NgZone, Renderer } from '@angular/core';
import { App } from '../app/app';
import { Ion } from '../ion';
import { Config } from '../../config/config';
import { Keyboard } from '../../util/keyboard';
import { ScrollView } from '../../util/scroll-view';
import { Tabs } from '../tabs/tabs';
import { ViewController } from '../../navigation/view-controller';
export declare class Content extends Ion {
    _app: App;
    _keyboard: Keyboard;
    _zone: NgZone;
    _tabs: Tabs;
    _paddingTop: number;
    _paddingRight: number;
    _paddingBottom: number;
    _paddingLeft: number;
    _scrollPadding: number;
    _headerHeight: number;
    _footerHeight: number;
    _tabbarHeight: number;
    _tabsPlacement: string;
    _inputPolling: boolean;
    _scroll: ScrollView;
    _scLsn: Function;
    _sbPadding: boolean;
    _fullscreen: boolean;
    _footerEle: HTMLElement;
    _scrollEle: HTMLElement;
    _fixedEle: HTMLElement;
    contentTop: number;
    contentBottom: number;
    constructor(config: Config, elementRef: ElementRef, renderer: Renderer, _app: App, _keyboard: Keyboard, _zone: NgZone, viewCtrl: ViewController, _tabs: Tabs);
    ngOnInit(): void;
    ngOnDestroy(): void;
    addScrollListener(handler: any): Function;
    addTouchStartListener(handler: any): Function;
    addTouchMoveListener(handler: any): Function;
    addTouchEndListener(handler: any): Function;
    addMouseDownListener(handler: any): Function;
    addMouseUpListener(handler: any): Function;
    addMouseMoveListener(handler: any): Function;
    _addListener(type: string, handler: any): Function;
    getScrollElement(): HTMLElement;
    onScrollEnd(callback: Function): void;
    onScrollElementTransitionEnd(callback: Function): void;
    scrollTo(x: number, y: number, duration?: number): Promise<any>;
    scrollToTop(duration?: number): Promise<any>;
    getScrollTop(): number;
    setScrollTop(top: number): void;
    scrollToBottom(duration?: number): Promise<any>;
    jsScroll(onScrollCallback: Function): Function;
    fullscreen: boolean;
    setScrollElementStyle(prop: string, val: any): void;
    getContentDimensions(): {
        contentHeight: number;
        contentTop: number;
        contentBottom: number;
        contentWidth: number;
        contentLeft: number;
        contentRight: number;
        scrollHeight: number;
        scrollTop: number;
        scrollBottom: number;
        scrollWidth: number;
        scrollLeft: number;
        scrollRight: number;
    };
    addScrollPadding(newPadding: number): void;
    clearScrollPaddingFocusOut(): void;
    resize(): void;
    readDimensions(): void;
    writeDimensions(): void;
}
