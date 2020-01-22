import {jsPlumb} from 'jsplumb';

const jsPlumbKey = {};

export {jsPlumbKey};

export function createEndpointUuid(activityId, outcome) {
    return `activity-${activityId}-${outcome}`;
}

export function createActivityElementId(activityId) {
    return `activity-${activityId}`;
}

export function createSourceEndpoint(activityId, outcome) {
    const fill = '#7da7f2';
    const stroke = fill;

    return {
        type: "Dot",
        anchor: 'Continuous',
        paintStyle: {
            stroke: stroke,
            fill: fill,
            strokeWidth: 2
        },
        isSource: true,
        connector: ['StateMachine', {}],
        connectorStyle: {
            strokeWidth: 2,
            stroke: stroke,
            
        },
        connectorHoverStyle: {
            strokeWidth: 2,
            stroke: '#999999'
        },
        dragOptions: {},
        uuid: createEndpointUuid(activityId, outcome),
        parameters: {
            outcome
        },
        scope: null,
        reattachConnections: true,
        maxConnections: 1
    };
}

export function createJsPlumbInstance(element) {
    const fill = '#7da7f2';
    const stroke = fill;

    const p = jsPlumb.getInstance({
        DragOptions: {cursor: 'pointer', zIndex: 2000},
        ConnectionOverlays: [
            ['Arrow', {
                location: 1,
                visible: true,
                width: 20,
                length: 10,
                foldback: 0.8,
                paintStyle: {
                    stroke: stroke,
                    fill: fill
                }
            }]
        ],
        Container: element
    });

    p.Defaults.Anchor = "Continuous";

    return p;
}