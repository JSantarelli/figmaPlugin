"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable @typescript-eslint/no-explicit-any */
figma.showUI(__html__, { width: 480, height: 780 });
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'run-review') {
        const selectedElements = figma.currentPage.selection;
        const groupedIssues = [];
        const expectedTextStyle = "Header/Medium";
        const expectedColorStyle = "Alias/Text/strong";
        for (const element of selectedElements) {
            if (element.type === 'FRAME' || element.type === 'GROUP') {
                const children = element.children || [];
                const frameIssues = {
                    frameName: element.name,
                    groupedIssues: [],
                };
                // Check text tokens
                for (const child of children) {
                    if (child.type === 'TEXT') {
                        const textIssues = yield checkTokens(child, expectedTextStyle, expectedColorStyle);
                        console.log(`Text issues for ${child.name}:`, textIssues);
                        frameIssues.groupedIssues.push(...textIssues.map(issue => (Object.assign(Object.assign({}, issue), { elementName: child.name }))));
                    }
                }
                // Check paddings
                if (children.length > 0) {
                    const paddings = calculatePaddings(element, children);
                    console.log(`Paddings for ${element.name}:`, paddings);
                    ['left', 'right', 'top', 'bottom'].forEach((direction) => {
                        const expectedPadding = direction === 'left' || direction === 'right' ? 56 : 24;
                        if (paddings[direction] !== expectedPadding) {
                            console.log(`Padding issue detected in ${direction} for ${element.name}. Expected ${expectedPadding}, found ${paddings[direction]}`);
                            frameIssues.groupedIssues.push({
                                element,
                                spacing: paddings[direction],
                                expected: expectedPadding,
                                type: 'padding',
                                direction,
                            });
                        }
                    });
                    // Check vertical spacing between elements
                    for (let i = 0; i < children.length - 1; i++) {
                        const elem1 = children[i];
                        const elem2 = children[i + 1];
                        if (!elem1 || !elem2)
                            continue;
                        const { verticalSpacing } = getSpacingBetweenElements(elem1, elem2, element.name, children);
                        if (verticalSpacing.actual !== verticalSpacing.expected) {
                            frameIssues.groupedIssues.push({
                                element1: elem1,
                                element2: elem2,
                                spacing: verticalSpacing.actual,
                                expected: verticalSpacing.expected,
                                type: 'spacing',
                                direction: 'vertical',
                            });
                        }
                    }
                    // Check specific elements
                    for (const child of children) {
                        if (child.type === 'TEXT' && child.name === 'main__heading') {
                            const textIssues = yield checkTokens(child, expectedTextStyle, expectedColorStyle);
                            console.log(`Text issues for ${child.name}:`, textIssues);
                            frameIssues.groupedIssues.push(...textIssues);
                        }
                        if (child.type === 'TEXT' && child.name === 'main__instructional') {
                            const textIssues = yield checkTokens(child, "Body/Medium", "Alias/Text/default");
                            console.log(`Text issues for ${child.name}:`, textIssues);
                            frameIssues.groupedIssues.push(...textIssues);
                        }
                        // Check stepper position
                        if (child.type === 'FRAME' && child.name === 'Stepper') {
                            const prevSibling = children[children.indexOf(child) - 1];
                            const nextSibling = children[children.indexOf(child) + 1];
                            if (prevSibling && prevSibling.name === 'main__instructional' && nextSibling && nextSibling.name === 'main__content') {
                                console.log(`Stepper is correctly placed between 'main__instructional' and 'main__content'`);
                            }
                            else {
                                console.log(`Stepper is incorrectly placed`);
                                frameIssues.groupedIssues.push({
                                    element: child,
                                    type: 'layout',
                                    property: 'Position',
                                    expected: 'Between main__instructional and main__content',
                                    actual: 'Incorrect position',
                                });
                            }
                        }
                    }
                }
                // Check text styling
                for (const child of children) {
                    if (child.type === 'TEXT') {
                        const stylingIssues = yield checkStyling(child);
                        frameIssues.groupedIssues.push(...stylingIssues.map((issue) => (Object.assign(Object.assign({}, issue), { elementName: child.name }))));
                    }
                }
                if (frameIssues.groupedIssues.length > 0) {
                    groupedIssues.push(frameIssues);
                }
            }
        }
        console.log('Grouped Issues:', groupedIssues);
        figma.ui.postMessage({
            type: 'show-groupedIssues',
            grouped: groupedIssues,
        });
    }
    if (msg.type === 'highlight-frame') {
        const { frameId } = msg;
        try {
            const node = yield figma.getNodeByIdAsync(frameId);
            if (node && 'fills' in node) {
                node.setPluginData('originalFills', JSON.stringify(node.fills));
                node.fills = [
                    {
                        type: 'SOLID',
                        color: { r: 1, g: 0.831, b: 0.227 },
                        opacity: 1,
                        blendMode: 'NORMAL',
                    },
                ];
            }
            else if (node) {
                figma.notify(`Cannot highlight node "${node.name}" because it does not support fills.`);
            }
            else {
                figma.notify(`Node with ID ${frameId} not found.`);
            }
        }
        catch (error) {
            console.error('Error fetching node by ID:', error);
            figma.notify('An error occurred while trying to highlight the frame.');
        }
    }
    if (msg.type === 'reset-highlight') {
        const node = yield figma.getNodeByIdAsync(msg.frameId);
        if (node && 'fills' in node) {
            const originalFills = node.getPluginData('originalFills');
            if (originalFills) {
                node.fills = JSON.parse(originalFills);
            }
        }
    }
    if (msg.type === 'add-landmark') {
        const selectedNodes = figma.currentPage.selection;
        if (selectedNodes.length === 0) {
            figma.notify('Please select at least one frame or group.');
            return;
        }
        // Load fonts before creating text
        yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
        // Track added landmarks to send to UI
        const addedLandmarks = [];
        for (const node of selectedNodes) {
            if (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'COMPONENT') {
                let landmark = '';
                let role = '';
                // Determine landmark type based on node name
                if (node.name === 'main') {
                    landmark = '<main>';
                    role = 'main';
                }
                else if (node.name === 'Tabs' || node.name === 'Stepper' || node.name === 'Breadcrumb') {
                    landmark = '<div role="navigation">';
                    role = 'navigation';
                }
                else if (node.name === 'main__content') {
                    landmark = '<section>';
                    role = 'section';
                }
                if (landmark) {
                    if ('fills' in node) {
                        node.setPluginData('originalFills', JSON.stringify(node.fills));
                        node.strokes = [
                            {
                                type: 'SOLID',
                                color: { r: 1, g: 0.831, b: 0.227 },
                                opacity: 1,
                            },
                        ];
                        node.effects = [
                            {
                                type: "DROP_SHADOW",
                                color: { r: 1, g: 0.831, b: 0.227, a: 1 },
                                offset: { x: 0, y: 0 },
                                radius: 4,
                                spread: 6,
                                visible: true,
                                blendMode: "NORMAL",
                            },
                        ];
                    }
                    const yellowFrame = figma.createFrame();
                    yellowFrame.resize(140, 36);
                    yellowFrame.fills = [
                        {
                            type: 'SOLID',
                            color: { r: 1, g: 0.831, b: 0.227 },
                            opacity: 1,
                        },
                    ];
                    yellowFrame.name = "Landmark Label";
                    // Create text node
                    const textNode = figma.createText();
                    textNode.characters = landmark;
                    textNode.fontSize = 14;
                    textNode.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
                    // Add text to the frame
                    yellowFrame.appendChild(textNode);
                    // Position text in center of frame
                    setTimeout(() => {
                        textNode.x = (yellowFrame.width - textNode.width) / 2;
                        textNode.y = (yellowFrame.height - textNode.height) / 2;
                    }, 100);
                    const bounds = node.absoluteBoundingBox;
                    if (bounds) {
                        const { x, y } = bounds;
                        yellowFrame.x = x - yellowFrame.width + 140;
                        yellowFrame.y = y - yellowFrame.height + 36;
                    }
                    figma.currentPage.appendChild(yellowFrame);
                    // Store label ID for potential future reference
                    node.setPluginData('landmarkLabelId', yellowFrame.id);
                    // Add to tracking array for UI
                    addedLandmarks.push({
                        nodeId: node.id,
                        nodeName: node.name,
                        landmark,
                        role,
                        labelId: yellowFrame.id
                    });
                }
                else {
                    figma.notify(`No accessibility landmark available for "${node.name}".`);
                }
            }
        }
        // Important: Always send the landmarks to UI if any were created
        if (addedLandmarks.length > 0) {
            console.log('Sending landmarks to UI:', addedLandmarks);
            addedLandmarks.forEach(landmark => {
                figma.ui.postMessage({
                    type: 'landmark-added',
                    landmark: landmark
                });
            });
            figma.notify(`${addedLandmarks.length} accessibility landmark(s) applied.`);
        }
    }
    // New handler to fetch existing landmarks when the Landmarks tab is selected
    if (msg.type === 'get-landmarks') {
        const existingLandmarks = [];
        // Search through all frames on the current page for landmark data
        const nodes = figma.currentPage.findAll(node => node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'COMPONENT');
        for (const node of nodes) {
            // Check if this node has a landmark label ID stored
            const labelId = node.getPluginData('landmarkLabelId');
            if (labelId) {
                let landmark = '';
                let role = '';
                // Determine landmark type based on node name (same logic as before)
                if (node.name === 'main') {
                    landmark = '<main>';
                    role = 'main';
                }
                else if (node.name === 'Tabs' || node.name === 'Stepper' || node.name === 'Breadcrumb') {
                    landmark = '<div role="navigation">';
                    role = 'navigation';
                }
                else if (node.name === 'main__content') {
                    landmark = '<section>';
                    role = 'section';
                }
                if (landmark) {
                    existingLandmarks.push({
                        nodeId: node.id,
                        nodeName: node.name,
                        landmark,
                        role,
                        labelId
                    });
                }
            }
        }
        // Send existing landmarks to UI
        figma.ui.postMessage({
            type: 'landmarks-loaded',
            landmarks: existingLandmarks
        });
    }
    // Handler to remove landmarks
    if (msg.type === 'remove-landmark') {
        const { nodeId, labelId } = msg;
        try {
            // Get the target node and its label
            const node = yield figma.getNodeByIdAsync(nodeId);
            const labelNode = labelId ? yield figma.getNodeByIdAsync(labelId) : null;
            if (node) {
                // Reset node styling
                if ('strokes' in node) {
                    node.strokes = [];
                }
                if ('effects' in node) {
                    node.effects = [];
                }
                // Clear landmark data
                node.setPluginData('landmarkLabelId', '');
                // Remove label if it exists
                if (labelNode) {
                    labelNode.remove();
                }
                figma.notify('Landmark removed.');
            }
        }
        catch (error) {
            console.error('Error removing landmark:', error);
            figma.notify('Error removing landmark.');
        }
    }
});
function checkTokens(child, expectedTextStyle, expectedColorStyle) {
    return __awaiter(this, void 0, void 0, function* () {
        const issues = [];
        // Check text style token
        const textStyleId = child.textStyleId;
        if (textStyleId) {
            const style = yield figma.getStyleByIdAsync(textStyleId);
            if (style && style.name !== expectedTextStyle) {
                issues.push({
                    element: child,
                    type: 'font-token',
                    property: 'Text Style',
                    expected: expectedTextStyle,
                    actual: style.name,
                });
            }
        }
        else {
            issues.push({
                element: child,
                type: 'font-token',
                property: 'Text Style',
                expected: expectedTextStyle,
                actual: "No style applied",
            });
        }
        // Check color style token
        const fills = child.fills;
        if (fills && fills.length > 0 && fills[0].type === 'SOLID') {
            const paintStyleId = fills[0].styleId;
            if (paintStyleId) {
                const colorStyle = yield figma.getStyleByIdAsync(paintStyleId);
                if (colorStyle && colorStyle.name !== expectedColorStyle) {
                    issues.push({
                        element: child,
                        type: 'color-token',
                        property: 'Fill Style',
                        expected: expectedColorStyle,
                        actual: colorStyle.name,
                    });
                }
            }
            else {
                issues.push({
                    element: child,
                    type: 'color-token',
                    property: 'Fill Style',
                    expected: expectedColorStyle,
                    actual: "No style applied",
                });
            }
        }
        else {
            issues.push({
                element: child,
                type: 'color-token',
                property: 'Fill Style',
                expected: expectedColorStyle,
                actual: "No fill or unsupported fill type",
            });
        }
        return issues;
    });
}
function calculatePaddings(frame, children) {
    const frameBounds = {
        left: frame.x,
        right: frame.x + frame.width,
        top: frame.y,
        bottom: frame.y + frame.height,
    };
    let paddingLeft = Infinity, paddingRight = Infinity, paddingTop = Infinity, paddingBottom = Infinity;
    for (const child of children) {
        const childBounds = {
            left: child.x,
            right: child.x + child.width,
            top: child.y,
            bottom: child.y + child.height,
        };
        paddingLeft = Math.min(paddingLeft, childBounds.left - frameBounds.left);
        paddingRight = Math.min(paddingRight, frameBounds.right - childBounds.right);
        paddingTop = Math.min(paddingTop, childBounds.top - frameBounds.top);
        paddingBottom = Math.min(paddingBottom, frameBounds.bottom - childBounds.bottom);
    }
    return {
        left: paddingLeft === Infinity ? 0 : paddingLeft,
        right: paddingRight === Infinity ? 0 : paddingRight,
        top: Math.abs(paddingTop) === 24 ? 24 : paddingTop === Infinity ? 0 : paddingTop,
        bottom: paddingBottom === Infinity ? 0 : paddingBottom
    };
}
function getSpacingBetweenElements(elem1, elem2, parentName, children) {
    let expectedVerticalSpacing = 16;
    if (parentName === 'main') {
        if (elem1.name === 'Breadcrumb' && elem2.name === 'main__heading') {
            expectedVerticalSpacing = 16;
        }
        else if (elem1.name === 'main__instructional' && elem2.name === 'Tabs') {
            expectedVerticalSpacing = 16;
        }
        else if (elem1.name === 'Tabs' && elem2.name === 'main__content') {
            expectedVerticalSpacing = 16;
        }
        else if (elem1.name === 'main__heading' && elem2.name === 'main__content' && !children.some(e => e.name === 'Tabs')) {
            expectedVerticalSpacing = 24;
        }
    }
    const verticalSpacing = Math.abs(elem2.y - (elem1.y + elem1.height));
    return {
        verticalSpacing: { actual: verticalSpacing, expected: expectedVerticalSpacing },
    };
}
function checkStyling(child) {
    return __awaiter(this, void 0, void 0, function* () {
        const issues = [];
        // Check if the child is a text element
        if (child.type !== 'TEXT')
            return issues;
        // Define expected styles for each element
        const styles = {
            'main__heading': {
                fontFamily: 'Lato',
                fontSize: 24,
                fontStyle: 'normal',
                fontWeight: 700,
                lineHeight: 28,
            },
            'main__instructional': {
                fontFamily: 'Lato',
                fontSize: 14,
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: 20,
            }
        };
        // Check if there are expected styles for the current element
        if (styles[child.name]) {
            const expectedStyles = styles[child.name];
            // Get the actual styles from the child element
            const actualStyles = {
                fontFamily: child.fontName.family,
                fontSize: child.fontSize,
                fontStyle: child.fontName.style.includes('Italic') ? 'italic' : 'normal',
                fontWeight: child.fontName.style.includes('Bold') ? 700 : 400,
                lineHeight: child.lineHeight.value,
            };
            // Compare the actual styles with the expected ones
            Object.keys(expectedStyles).forEach((property) => {
                if (actualStyles[property] !== expectedStyles[property]) {
                    issues.push({
                        element: child,
                        type: 'styling',
                        property: property.toString(),
                        expected: expectedStyles[property],
                        actual: actualStyles[property],
                    });
                }
            });
        }
        return issues;
    });
}
