/*
 * mydraft.cc
 *
 * @license
 * Copyright (c) Sebastian Stehle. All rights reserved.
*/

import * as svg from '@svgdotjs/svg.js';
import { Color } from './color';
import { sizeInPx } from './react';
import { Rect2 } from './rect2';
import { Types } from './types';
import { Vec2 } from './vec2';

export interface MatrixTransform {
    rect?: Rect2;

    x?: number;
    y?: number;

    rotation?: number;

    rx?: number;
    ry?: number;

    w?: number;
    h?: number;
}

export module SVGHelper {
    export const COLOR_BLACK = new svg.Color('#000');
    export const COLOR_WHITE = new svg.Color('#fff');
    export const ZERO_POINT = new svg.Point(0, 0);
    export const IDENTITY_MATRIX = new svg.Matrix(1, 0, 0, 1, 0, 0);
    
    export function roundedRectangleRight(rectangle: Rect2, radius = 10) {
        const rad = Math.min(radius, rectangle.width * 0.5, rectangle.height * 0.5);

        const t = rectangle.top;
        const l = rectangle.left;
        const r = rectangle.right;
        const b = rectangle.bottom;

        return `M${l},${t} L${r - rad},${t} a${rad},${rad} 0 0 1 ${rad},${rad} L${r},${b - rad} a${rad},${rad} 0 0 1 -${rad},${rad} L${l},${b} z`;
    }

    export function roundedRectangleLeft(rectangle: Rect2, radius = 10) {
        const rad = Math.min(radius, rectangle.width * 0.5, rectangle.height * 0.5);

        const t = rectangle.top;
        const l = rectangle.left;
        const r = rectangle.right;
        const b = rectangle.bottom;

        return `M${r},${b} L${l + rad},${b} a${rad},${rad} 0 0 1 -${rad},-${rad} L${l},${t + rad} a${rad},${rad} 0 0 1 ${rad},-${rad} L${r},${t} z`;
    }

    export function roundedRectangleTop(rectangle: Rect2, radius = 10) {
        const rad = Math.min(radius, rectangle.width * 0.5, rectangle.height * 0.5);

        const t = rectangle.top;
        const l = rectangle.left;
        const r = rectangle.right;
        const b = rectangle.bottom;

        return `M${l},${b} L${l},${t + rad} a${rad},${rad} 0 0 1 ${rad},-${rad} L${r - rad},${t} a${rad},${rad} 0 0 1 ${rad},${rad} L${r},${b} z`;
    }

    export function roundedRectangleBottom(rectangle: Rect2, radius = 10) {
        const rad = Math.min(radius, rectangle.width * 0.5, rectangle.height * 0.5);

        const t = rectangle.top;
        const l = rectangle.left;
        const r = rectangle.right;
        const b = rectangle.bottom;

        return `M${r},${t} L${r},${b - rad} a${rad},${rad} 0 0 1 -${rad},${rad} L${l + rad},${b} a${rad},${rad} 0 0 1 -${rad},-${rad} L${l},${t}z`;
    }

    export function createText(text?: string, fontSize?: number, alignment?: string, verticalAlign?: string) {
        fontSize = fontSize || 10;

        const element = new svg.ForeignObject();

        const div = document.createElement('div');
        div.className = 'no-select';
        div.style.textAlign = alignment || 'center';
        div.style.fontFamily = 'inherit';
        div.style.fontSize = fontSize ? sizeInPx(fontSize) : '10px';
        div.style.overflow = 'hidden';
        div.style.verticalAlign = verticalAlign || 'middle';
        div.textContent = text || null;

        element.node.appendChild(div);

        return element;
    }

    export function transform<T extends svg.Element>(element: T, t: MatrixTransform, adjust = true, move = false): T {
        let x = t.rect ? t.rect.x : t.x || 0;
        let y = t.rect ? t.rect.y : t.y || 0;

        const w = Math.round(t.rect ? t.rect.width : t.w || 0);
        const h = Math.round(t.rect ? t.rect.height : t.h || 0);

        if (!t.rotation && adjust) {
            x = Math.round(x);
            y = Math.round(y);
        }

        // Use the alternative methods with O to not create a new matrix.
        let matrix = new svg.Matrix()
            .rotateO(
                t.rotation || 0,
                t.rx || (x + 0.5 * w),
                t.ry || (y + 0.5 * h),
            );

        if (!move) {
            if (t.rect || t.x || t.y) {
                // Use the alternative methods with O to not create a new matrix.
                matrix = matrix.multiplyO(new svg.Matrix().translateO(x, y));
            }

            element.matrix(matrix);
        } else {
            element.matrix(matrix);

            if (t.rect || t.x || t.y) {
                element.move(x, y);
            }
        }

        if ((t.rect || t.w || t.h) && w > 0 && h > 0) {
            if (element.node.nodeName === 'foreignObject') {
                const text = <HTMLDivElement>element.node.children[0];

                if (text.style.verticalAlign === 'middle') {
                    text.style.lineHeight = sizeInPx(h);
                } else {
                    text.style.lineHeight = '1.5';
                }

                text.style.height = sizeInPx(h);
            }

            if (element.node.nodeName === 'ellipse') {
                const ellipse = <svg.Ellipse>(element as any);

                ellipse.cx(w * 0.5);
                ellipse.cy(h * 0.5);
                ellipse.radius(w * 0.5, h * 0.5);
            } else {
                setSize(element, w, h);
            }
        }

        return element;
    }

    export function vec2Point(vec: Vec2): svg.Point {
        return new svg.Point(vec.x, vec.y);
    }

    export function point2Vec(point: svg.Point): Vec2 {
        return new Vec2(point.x, point.y);
    }

    export function box2Rect(box: svg.Box): Rect2 {
        return new Rect2(box.x, box.y, box.w, box.h);
    }

    export function setPosition(element: svg.Element, x: number, y: number) {
        element.matrix(new svg.Matrix().translate(x, y));
    }

    export function setSize(element: svg.Element, width: number, height: number) {
        element.attr('width', width).attr('height', height);
    }

    export function toColor(value: string | number | Color | null | undefined): string {
        if (Types.isString(value)) {
            return value;
        } else if (value) {
            return Color.fromValue(value).toString();
        } else {
            return 'black';
        }
    }
}
