/**
 * Copyright (c) 2017 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { Terminal } from 'xterm';
import { BaseRenderLayer } from './BaseRenderLayer';
import { INVERTED_DEFAULT_COLOR } from 'browser/renderer/Constants';
import { is256Color } from '../atlas/CharAtlasUtils';
import { ITerminal, IColorSet, ILinkifierEvent } from 'browser/Types';
import { IRenderDimensions } from 'browser/renderer/Types';
import { ICoreBrowserService } from 'browser/services/Services';

export class LinkRenderLayer extends BaseRenderLayer {
  private _state: ILinkifierEvent | undefined;

  constructor(
    container: HTMLElement,
    zIndex: number,
    colors: IColorSet,
    terminal: ITerminal,
    coreBrowserService: ICoreBrowserService
  ) {
    super(container, 'link', zIndex, true, colors, coreBrowserService);

    terminal.linkifier2.onShowLinkUnderline(e => this._onShowLinkUnderline(e));
    terminal.linkifier2.onHideLinkUnderline(e => this._onHideLinkUnderline(e));
  }

  public resize(terminal: Terminal, dim: IRenderDimensions): void {
    super.resize(terminal, dim);
    // Resizing the canvas discards the contents of the canvas so clear state
    this._state = undefined;
  }

  public reset(terminal: Terminal): void {
    this._clearCurrentLink();
  }

  private _clearCurrentLink(): void {
    if (this._state) {
      this._clearCells(this._state.x1, this._state.y1, this._state.cols - this._state.x1, 1);
      const middleRowCount = this._state.y2 - this._state.y1 - 1;
      if (middleRowCount > 0) {
        this._clearCells(0, this._state.y1 + 1, this._state.cols, middleRowCount);
      }
      this._clearCells(0, this._state.y2, this._state.x2, 1);
      this._state = undefined;
    }
  }

  private _onShowLinkUnderline(e: ILinkifierEvent): void {
    if (e.fg === INVERTED_DEFAULT_COLOR) {
      this._ctx.fillStyle = this._colors.background.css;
    } else if (e.fg !== undefined && is256Color(e.fg)) {
      // 256 color support
      this._ctx.fillStyle = this._colors.ansi[e.fg!].css;
    } else {
      this._ctx.fillStyle = this._colors.foreground.css;
    }

    if (e.y1 === e.y2) {
      // Single line link
      this._fillBottomLineAtCells(e.x1, e.y1, e.x2 - e.x1);
    } else {
      // Multi-line link
      this._fillBottomLineAtCells(e.x1, e.y1, e.cols - e.x1);
      for (let y = e.y1 + 1; y < e.y2; y++) {
        this._fillBottomLineAtCells(0, y, e.cols);
      }
      this._fillBottomLineAtCells(0, e.y2, e.x2);
    }
    this._state = e;
  }

  private _onHideLinkUnderline(e: ILinkifierEvent): void {
    this._clearCurrentLink();
  }
}
