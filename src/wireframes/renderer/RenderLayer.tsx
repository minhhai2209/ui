/*
 * mydraft.cc
 *
 * @license
 * Copyright (c) Sebastian Stehle. All rights reserved.
*/

import { Diagram, DiagramItem, RendererService } from '@app/wireframes/model';
import * as React from 'react';
import * as svg from '@svgdotjs/svg.js';
import { ShapeRef } from './shape-ref';
import { getOrderedShapes } from './shape-rendering';

export interface RenderLayerProps {
    // The renderer service.
    rendererService: RendererService;

    // The selected diagram.
    diagram?: Diagram;

    // The container to render on.
    renderContainer: svg.Container;

    // The preview items.
    previewItems?: ReadonlyArray<DiagramItem>;

    // True when rendered.
    onRender?: () => void;
}

const showDebugOutlines = process.env.NODE_ENV === 'false';

export const RenderLayer = React.memo((props: RenderLayerProps) => {
    const {
        diagram,
        previewItems,
        renderContainer,
        rendererService,
        onRender,
    } = props;

    const shapesRendered = React.useRef(onRender);
    const shapeRefsById = React.useRef<{ [id: string]: ShapeRef }>({});

    const orderedShapes = React.useMemo(() => {
        return getOrderedShapes(diagram);
    }, [diagram]);

    React.useEffect(() => {
        const allShapesById: { [id: string]: boolean } = {};
        const allShapes = orderedShapes;

        allShapes.forEach(item => {
            allShapesById[item.id] = true;
        });

        const references = shapeRefsById.current;

        // Delete old shapes.
        for (const [id, ref] of Object.entries(references)) {
            if (!allShapesById[id]) {
                ref.remove();

                delete references[id];
            }
        }

        // Create missing shapes.
        for (const shape of allShapes) {
            if (!references[shape.id]) {
                const rendererInstance = rendererService.get(shape.renderer);

                references[shape.id] = new ShapeRef(renderContainer, rendererInstance, showDebugOutlines);
            }
        }

        let hasIdChanged = false;

        allShapes.forEach((shape, i) => {
            if (!references[shape.id].checkIndex(i)) {
                hasIdChanged = true;
            }
        });

        // If the index of at least once shape has changed we have to remove them all to render them in the correct order.
        if (hasIdChanged) {
            for (const ref of Object.values(references)) {
                ref.remove();
            }
        }

        for (const shape of allShapes) {
            references[shape.id].render(shape);
        }

        if (shapesRendered.current) {
            shapesRendered.current();
        }
    }, [renderContainer, orderedShapes, rendererService]);

    React.useEffect(() => {
        if (previewItems) {
            for (const item of previewItems) {
                shapeRefsById.current[item.id]?.setPreview(item);
            }
        } else {
            for (const reference of Object.values(shapeRefsById.current)) {
                reference.setPreview(null);
            }
        }
    }, [previewItems]);

    return null;
});
