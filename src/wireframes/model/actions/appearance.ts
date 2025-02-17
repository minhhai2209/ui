/*
 * mydraft.cc
 *
 * @license
 * Copyright (c) Sebastian Stehle. All rights reserved.
*/

import { ActionReducerMapBuilder, createAction } from '@reduxjs/toolkit';
import { Types } from '@app/core';
import { DiagramItemSet, EditorState, RendererService, Transform } from './../internal';
import { createItemsAction, DiagramRef, ItemsRef } from './utils';

export const changeItemsAppearance =
    createAction('items/appearance', (diagram: DiagramRef, shapes: ItemsRef, key: string, value: any, force = false) => {
        return { payload: createItemsAction(diagram, shapes, { appearance: { key, value }, force }) };
    });

export const transformItems =
    createAction('items/transform', (diagram: DiagramRef, items: ItemsRef, oldBounds: Transform, newBounds: Transform) => {
        return { payload: createItemsAction(diagram, items, { oldBounds: oldBounds.toJS(), newBounds: newBounds.toJS() }) };
    });

export function buildAppearance(builder: ActionReducerMapBuilder<EditorState>) {
    return builder
        .addCase(changeItemsAppearance, (state, action) => {
            const { diagramId, appearance, itemIds, force } = action.payload;

            return state.updateDiagram(diagramId, diagram => {
                const { key, value } = appearance;

                const set = DiagramItemSet.createFromDiagram(itemIds, diagram);

                return diagram.updateItems(set.allShapes.map(x => x.id), item => {
                    const rendererInstance = RendererService.get(item.renderer);

                    if (rendererInstance && (force || !Types.isUndefined(rendererInstance.defaultAppearance()[key]))) {
                        return item.setAppearance(key, value);
                    }

                    return item;
                });
            });
        })
        .addCase(transformItems, (state, action) => {
            const { diagramId, itemIds } = action.payload;

            return state.updateDiagram(diagramId, diagram => {
                const boundsOld = Transform.fromJS(action.payload.oldBounds);
                const boundsNew = Transform.fromJS(action.payload.newBounds);

                const set = DiagramItemSet.createFromDiagram(itemIds, diagram);

                return diagram.updateItems(set.allItems.map(x => x.id), item => {
                    return item.transformByBounds(boundsOld, boundsNew);
                });
            });
        });
}
