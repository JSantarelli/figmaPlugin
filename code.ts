/* eslint-disable @typescript-eslint/no-explicit-any */
figma.showUI(__html__, { width: 320, height: 780 });

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'run-review') {
        const selectedElements = figma.currentPage.selection;
        const groupedIssues: any[] = [];

        
        const expectedTextStyle = "Header/Medium";
        const expectedColorStyle = "Alias/Text/strong";

        for (const element of selectedElements) {
            if (element.type === 'FRAME' || element.type === 'GROUP') {
                const children: any = element.children || [];
                const frameIssues: any = {
                    frameName: element.name,
                    groupedIssues: [],
                };

                for (const child of children) {
                    if (child.type === 'TEXT') {
                        const textIssues = await checkStyling(child);
                        frameIssues.groupedIssues.push(...textIssues.map((issue) => ({
                            ...issue,
                            elementName: child.name,
                        })));
                    }
                }

                if (frameIssues.groupedIssues.length > 0) {
                    groupedIssues.push(frameIssues);
                }
            }
        }


        figma.ui.onmessage = async (msg) => {
            if (msg.type === 'highlight-frame') {
                const { frameId } = msg;
        
                try {
                    const node = await figma.getNodeByIdAsync(frameId);
        
                    if (node && 'fills' in node) {
                        
                        node.setPluginData('originalFills', JSON.stringify(node.fills));
                  
                        
                        node.fills = [
                          {
                            type: 'SOLID',
                            color: { r: 1, g: 1, b: 0 }, 
                            opacity: 0.5, 
                            blendMode: 'MULTIPLY', 
                          },
                        ];
                      } else if (node) {
                        
                        figma.notify(`Cannot highlight node "${node.name}" because it does not support strokes.`);
                    } else {
                        figma.notify(`Node with ID ${frameId} not found.`);
                    }
                } catch (error) {
                    console.error('Error fetching node by ID:', error);
                    figma.notify('An error occurred while trying to highlight the frame.');
                }
            }
            
            if (msg.type === 'reset-highlight') {
                const node = await figma.getNodeByIdAsync(msg.frameId);
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
            
                for (const node of selectedNodes) {
                    if (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'COMPONENT') {
                        let landmark = '';
                        if (node.name === 'main__content') {
                            landmark = '<main>';
                        } else if (node.name === 'Tabs' || node.name === 'Stepper') {
                            landmark = '<div role="navigation">';
                        }
            
                        if (landmark) {
                            if ('fills' in node) {
                                node.setPluginData('originalFills', JSON.stringify(node.fills)); 
                                node.strokes = [
                                    {
                                        type: 'SOLID',
                                        color: { r: 1, g: 1, b: 0 }, 
                                        opacity: 1, 
                                    },
                                ];
                                node.effects = [
                                    {
                                        type: "DROP_SHADOW",
                                        color: { r: 1, g: 1, b: 0, a: 1 }, 
                                        offset: { x: 4, y: 4 },
                                        radius: 2,
                                        spread: 4,
                                        visible: true,
                                        blendMode: "NORMAL",
                                    },
                                ];
                            }
                        }
                        
                        
                        const yellowFrame = figma.createFrame();
                        yellowFrame.resize(280, 120); 

                        
                        yellowFrame.fills = [
                            {
                                type: 'SOLID',
                                color: { r: 1, g: 1, b: 0 }, 
                                opacity: 1, 
                            },
                        ];

                        yellowFrame.name = landmark; 

                        
                        const bounds = node.absoluteBoundingBox;

                        if (bounds) {
                            const { x, y } = bounds;

                            yellowFrame.x = x - yellowFrame.width + 280; 
                            yellowFrame.y = y - yellowFrame.height + 120; 
                        }

                        figma.currentPage.appendChild(yellowFrame);

                            figma.notify('Accessibility landmarks applied.');
                                } else {
                                    figma.notify(`No accessibility landmark available for "${node.name}".`);
                                }
                            }
                        }
                    };

        for (const element of selectedElements) {
            if (element.type === 'FRAME' || element.type === 'GROUP') {
                const children: any = element.children || [];
                const frameIssues: any = {
                    frameName: element.name,
                    groupedIssues: [],
                };

                
                for (const child of children) {
                    if (child.type === 'TEXT') {
                        const textIssues = await checkTokens(child, expectedTextStyle, expectedColorStyle);
                        console.log(`Text issues for ${child.name}:`, textIssues);
                
                        
                        frameIssues.groupedIssues.push(...textIssues.map(issue => ({
                            ...issue,
                            elementName: child.name,  
                        })));
                    }
                }
                
                if (children.length > 0) {
                    const paddings: any = calculatePaddings(element, children);
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
                    
                    for (let i = 0; i < children.length - 1; i++) {
                        const elem1 = children[i];
                        const elem2 = children[i + 1];
                    
                        
                        if (!elem1 || !elem2) continue;
                    
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
                                 
                for (const child of children) {
                    if (child.type === 'TEXT' && child.name === 'main__heading') {
                        const textIssues = await checkTokens(child, expectedTextStyle, expectedColorStyle);
                        console.log(`Text issues for ${child.name}:`, textIssues);
                        frameIssues.groupedIssues.push(...textIssues);
                    }
                    
                    if (child.type === 'TEXT' && child.name === 'main__instructional') {
                        const textIssues = await checkTokens(child, "Body/Medium", "Alias/Text/default");
                        console.log(`Text issues for ${child.name}:`, textIssues);
                        frameIssues.groupedIssues.push(...textIssues);
                    }
                
                    
                    if (child.type === 'FRAME' && child.name === 'Stepper') {
                        
                        const prevSibling = children[children.indexOf(child) - 1];
                        const nextSibling = children[children.indexOf(child) + 1];
                        if (prevSibling && prevSibling.name === 'main__instructional' && nextSibling && nextSibling.name === 'main__content') {
                            console.log(`Stepper is correctly placed between 'main__instructional' and 'main__content'`);
                        } else {
                            console.log(`Stepper is incorrectly placed`);
                        }
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
}


async function checkTokens(child: any, expectedTextStyle: string, expectedColorStyle: string) {
    const issues = [];
    const textStyleId = child.textStyleId;
    if (textStyleId) {
        const style = await figma.getStyleByIdAsync(textStyleId);
        if (style && style.name !== expectedTextStyle) {
            issues.push({
                element: child,
                type: 'font-token',
                property: 'Text Style',
                expected: expectedTextStyle,
                actual: style.name,
            });
        }
    } else {
        issues.push({
            element: child,
            type: 'font-token',
            property: 'Text Style',
            expected: expectedTextStyle,
            actual: "No style applied",
        });
    }

    
    const fills = child.fills;
    if (fills && fills.length > 0 && fills[0].type === 'SOLID') {
        const paintStyleId = fills[0].styleId;
        if (paintStyleId) {
            const colorStyle = await figma.getStyleByIdAsync(paintStyleId);
            if (colorStyle && colorStyle.name !== expectedColorStyle) {
                issues.push({
                    element: child,
                    type: 'color-token',
                    property: 'Fill Style',
                    expected: expectedColorStyle,
                    actual: colorStyle.name,
                });
            }
        } else {
            issues.push({
                element: child,
                type: 'color-token',
                property: 'Fill Style',
                expected: expectedColorStyle,
                actual: "No style applied",
            });
        }
    } else {
        issues.push({
            element: child,
            type: 'color-token',
            property: 'Fill Style',
            expected: expectedColorStyle,
            actual: "No fill or unsupported fill type",
        });
    }

    return issues;
}


function calculatePaddings(frame: any, children: any[]) {
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


function getSpacingBetweenElements(elem1: any, elem2: any, parentName: string, children: any[]) {
    let expectedVerticalSpacing = 16;

    if (parentName === 'main') {
        if (elem1.name === 'Breadcrumb' && elem2.name === 'main__heading') {
            expectedVerticalSpacing = 16;
        } else if (elem1.name === 'main__instructional' && elem2.name === 'Tabs') {
            expectedVerticalSpacing = 16;
        } else if (elem1.name === 'Tabs' && elem2.name === 'main__content') {
            expectedVerticalSpacing = 16;
        } else if (elem1.name === 'main__heading' && elem2.name === 'main__content' && !children.some(e => e.name === 'Tabs')) {
            expectedVerticalSpacing = 24;
        }
    }
    const verticalSpacing = Math.abs(elem2.y - (elem1.y + elem1.height));

    return {
        verticalSpacing: { actual: verticalSpacing, expected: expectedVerticalSpacing },
    };
}


async function checkStyling(child: any): Promise<any[]> {
    const issues: any[] = [];

    // Check if the child is a text element
    if (child.type !== 'TEXT') return issues;

    // Define expected styles for each element
    const styles: Record<string, {
        fontFamily: string;
        fontSize: number;
        fontStyle: string;
        fontWeight: number;
        lineHeight: number;
    }> = {
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

    // Ensure child.name is a valid key of styles
    const elementName = child.name as keyof typeof styles;

    // Check if there are expected styles for the current element
    if (styles[elementName]) {
        const expectedStyles = styles[elementName];
        
        // Get the actual styles from the child element
        const actualStyles = {
            fontFamily: child.fontName.family,
            fontSize: child.fontSize,
            fontStyle: child.fontName.style.includes('Italic') ? 'italic' : 'normal',
            fontWeight: child.fontName.style.includes('Bold') ? 700 : 400,
            lineHeight: child.lineHeight.value,
        };

        // Compare the actual styles with the expected ones
        (Object.keys(expectedStyles) as (keyof typeof expectedStyles)[]).forEach((property) => {
            if (actualStyles[property] !== expectedStyles[property]) {
                issues.push({
                    element: child,
                    type: 'styling',
                    property,
                    expected: expectedStyles[property],
                    actual: actualStyles[property],
                });
            }
        });
    }

    return issues;
}


}
