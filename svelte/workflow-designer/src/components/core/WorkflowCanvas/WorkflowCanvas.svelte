﻿<script>
  import { onMount, setContext, tick } from "svelte";
  import Panzoom from "@panzoom/panzoom";
  import {
    Activity as ActivityModel,
    Connection,
    Workflow
  } from "../../../models";
  import Activity from "../Activity/Activity.svelte";
  import ContextMenu from "../ContextMenu/ContextMenu.svelte";
  import ContextMenuItem from "../ContextMenu/ContextMenuItem.svelte";
  import {
    createJsPlumbInstance,
    createEndpointUuid,
    createActivityElementId,
    jsPlumbKey
  } from "../../../utils/jsPlumbUtils";
  import dagre from "../../../utils/dagre";

  const workflow = new Workflow();
  const writeLine1 = new ActivityModel({
    id: "1",
    type: "WriteLine",
    displayName: "Write Line",
    state: { text: { type: "Literal", expression: "Hello World!" } },
    outcomes: ["Done"],
    left: 100,
    top: 50
  });
  const writeLine2 = new ActivityModel({
    id: "2",
    type: "WriteLine",
    displayName: "Write Line",
    state: { text: { type: "Literal", expression: "Goodbye cruel world..." } },
    outcomes: ["Done"],
    left: 350,
    top: 350
  });

  setContext(jsPlumbKey, {
    getPlumber: () => jsPlumb
  });

  workflow.activities = [writeLine1, writeLine2];
  workflow.connections = [
    new Connection({
      sourceActivityId: "1",
      targetActivityId: "2",
      outcome: "Done"
    })
  ];

  let element;
  let jsPlumb;
  let panzoom;
  let activityContextMenu;
  let workflowContextMenu;
  let selectedActivity;
  let connectionCount = 0;

  onMount(() => {
    jsPlumb = createJsPlumbInstance(element);
    jsPlumb.setSuspendDrawing(true);

    // Wait for activity elements to be created.
    tick().then(() => {
      setupJsPlumb(jsPlumb);
    });

    panzoom = createPanzoom();

    return () => {
      jsPlumb.reset();
      panzoom.destroy();
    };
  });

  function setupJsPlumb(jsPlumb) {
    jsPlumb.bind("connection", connectionCreated);
    jsPlumb.bind("connectionDetached", connectionDetached);

    const createConnections = function(jsPlumb) {
      for (const connection of workflow.connections) {
        const sourceEndpointId = createEndpointUuid(
          connection.sourceActivityId,
          connection.outcome
        );
        const sourceEndpoint = jsPlumb.getEndpoint(sourceEndpointId);
        const targetElementId = createActivityElementId(
          connection.targetActivityId
        );

        jsPlumb.connect({
          source: sourceEndpoint,
          target: targetElementId,
          cssClass: "elsa"
        });
      }
    };

    createConnections(jsPlumb);
    jsPlumb.setSuspendDrawing(false, true);
  }

  function createPanzoom() {
    const panzoom = Panzoom(element, {
      maxScale: 4,
      minScale: 0.1,
      overflow: "hidden",
      contain: "outside"
    });

    element.parentElement.addEventListener("wheel", panzoom.zoomWithWheel);

    element.addEventListener("panzoomchange", e => {
      const zoom = e.detail.scale;
      jsPlumb.setZoom(zoom);
    });

    return panzoom;
  }

  function onWorkflowCanvasContextMenu(e) {
    workflowContextMenu.show(e);
    activityContextMenu.hide();
  }

  function onActivityContextMenu(e, activity) {
    selectedActivity = activity;
    activityContextMenu.show(e);
    workflowContextMenu.hide();
  }

  function connectionCreated(info) {
    const connection = info.connection;
    const sourceEndpoint = info.sourceEndpoint;
    const outcome = sourceEndpoint.getParameter("outcome");
    const labelOverLayId = sourceEndpoint.connectorOverlays[0][1].id;
    const labelOverlay = connection.getOverlay(labelOverLayId);

    labelOverlay.setLabel(outcome);

    // Check if we already have this connection.
    const sourceActivityId = info.source.getAttribute("data-activity-id");
    const targetActivityId = info.target.getAttribute("data-activity-id");
    const wfConnection = workflow.connections.find(
      x =>
        x.sourceActivityId === sourceActivityId &&
        x.targetActivityId === targetActivityId
    );

    if (!wfConnection) {
      // Add created connection to list.
      workflow.connections.push(
        new Connection({
          sourceActivityId: sourceActivityId,
          targetActivityId: targetActivityId,
          outcome: outcome
        })
      );
    }
  }

  function connectionDetached(info) {
    const sourceEndpoint = info.sourceEndpoint;
    const outcome = sourceEndpoint.getParameter("outcome");
    const sourceActivityId = info.source.getAttribute("data-activity-id");
    const targetActivityId = info.target.getAttribute("data-activity-id");

    workflow.connections = workflow.connections.filter(
      x =>
        !(
          x.sourceActivityId === sourceActivityId &&
          x.targetActivityId === targetActivityId &&
          x.outcome === outcome
        )
    );
  }

  function editSelectedActivity() {}

  function deleteSelectedActivity() {}

  function autoLayout() {
    var g = new dagre.graphlib.Graph();
    var allNodes = document.querySelectorAll("[data-activity-id]");
    g.setGraph({ nodesep: 100, ranksep: 100, marginx: 100, marginy: 100 });
    g.setDefaultEdgeLabel(function() { return {}; });

    allNodes.forEach(function(element) {
      var elDataId = element.dataset.activityId;
      g.setNode(elDataId, {
        width: element.offsetWidth,
        height: element.offsetHeight
      });
    });

    workflow.connections.forEach(function (connection) {
        g.setEdge(
            connection.sourceActivityId,
            connection.targetActivityId
        );
    });

    dagre.layout(g);

    g.nodes().forEach(function (n) {
        var node = g.node(n);
        var idNode = document.querySelector("[data-activity-id='" + n + "']");

        if (node != undefined) {
            var top = node.y - node.height / 2 + 'px';
            var left = node.x - node.width / 2 + 'px';
            var selectedNode = document.getElementById(idNode.id);
            selectedNode.style.left = left;
            selectedNode.style.top = top;

            if (idNode) {
                triggerMouseEvent(idNode, "mouseover");
                triggerMouseEvent(idNode, "mousedown");
                triggerMouseEvent(idNode, "mousemove");
                triggerMouseEvent(idNode, "mouseup");
            }
        }
    });
  }

  function triggerMouseEvent(node, eventType) {
      var clickEvent = document.createEvent('MouseEvents');
      clickEvent.initEvent(eventType, true, true);
      node.dispatchEvent(clickEvent);
  }
  
</script>

<style src="./WorkflowCanvas.scss">

</style>

<div class="workflow-canvas-container">
  <ContextMenu bind:this={activityContextMenu}>
    <ContextMenuItem on:click={editSelectedActivity}>Edit</ContextMenuItem>
    <ContextMenuItem on:click={deleteSelectedActivity}>Delete</ContextMenuItem>
  </ContextMenu>
  <ContextMenu bind:this={workflowContextMenu}>
    <ContextMenuItem>Add Activity</ContextMenuItem>
    <ContextMenuItem on:click={autoLayout}>Auto Layout</ContextMenuItem>
  </ContextMenu>
  <div
    class="workflow-canvas"
    bind:this={element}
    on:contextmenu={onWorkflowCanvasContextMenu}>
    {#if jsPlumb}
      {#each workflow.activities as activity (activity.id)}
        <Activity
          {activity}
          on:contextmenu={e => onActivityContextMenu(e, activity)} />
      {/each}
    {/if}
  </div>
</div>
