import { ComponentFactoryResolver, ElementRef, OnInit, OpaqueToken, Renderer, ViewContainerRef } from '@angular/core';
import { App } from './app';
import { Config } from '../../config/config';
import { Ion } from '../ion';
import { OverlayPortal } from '../nav/overlay-portal';
import { Platform } from '../../platform/platform';
export declare const AppRootToken: OpaqueToken;
export declare class IonicApp extends Ion implements OnInit {
    private _userCmp;
    private _cfr;
    private _platform;
    _viewport: ViewContainerRef;
    _modalPortal: OverlayPortal;
    _overlayPortal: OverlayPortal;
    _loadingPortal: OverlayPortal;
    _toastPortal: OverlayPortal;
    constructor(_userCmp: any, _cfr: ComponentFactoryResolver, elementRef: ElementRef, renderer: Renderer, config: Config, _platform: Platform, app: App);
    ngOnInit(): void;
    _getPortal(portal?: AppPortal): OverlayPortal;
    _disableScroll(shouldDisableScroll: boolean): void;
}
export declare enum AppPortal {
    DEFAULT = 0,
    MODAL = 1,
    LOADING = 2,
    TOAST = 3,
}
