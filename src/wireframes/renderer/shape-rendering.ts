/*
 * mydraft.cc
 *
 * @license
 * Copyright (c) Sebastian Stehle. All rights reserved.
*/

import { SVGHelper, Vec2 } from '@app/core';
import { Diagram, DiagramContainer, DiagramItem, RendererService } from '@app/wireframes/model';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import * as svg from '@svgdotjs/svg.js';

export async function exportDiagram(diagrams: ReadonlyArray<Diagram>, size: Vec2, rendererService: RendererService) {
    const doc = new jsPDF({
        format: [size.x, size.y],
    });

    let index = 0;

    for (const diagram of diagrams) {
        if (index > 0) {
            doc.addPage();
        }

        const document = svg.SVG();

        const group = document.group();

        SVGHelper.setPosition(group, 0.5, 0.5);
        SVGHelper.setSize(group, size.x, size.y);
        
        for (const shape of getOrderedShapes(diagram)) {
            const renderer = rendererService.get(shape.renderer);

            if (renderer) {
                renderer.setContext(group);
                renderer.render(shape, undefined);
            }
        }

        await doc.svg(document.node, { width: size.x, height: size.y });

        index++;
    }

    doc.save('My Diagram.pdf');
}

export function getOrderedShapes(diagram: Diagram | undefined) {
    const flattenShapes: DiagramItem[] = [];

    if (diagram) {
        let handleContainer: (itemIds: DiagramContainer) => any;

        // eslint-disable-next-line prefer-const
        handleContainer = itemIds => {
            for (const id of itemIds.values) {
                const item = diagram.items.get(id);

                if (item) {
                    if (item.type === 'Shape') {
                        flattenShapes.push(item);
                    }

                    if (item.type === 'Group') {
                        handleContainer(item.childIds);
                    }
                }
            }
        };

        handleContainer(diagram.itemIds);
    }

    return flattenShapes;
}