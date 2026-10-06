import { useEffect, useState } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    type Node,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { supabase } from "../../lib/supabase";
import InterviewQuestionNode from "./InterviewQuestionNode";
import dagre from "dagre";
interface DatabaseNode {
    id: string;
    parent_id: string | null;
    question: string;
    layer: number;
    category: string | null;
    difficulty: string | null;
    hook: string | null;
    status: "Unanswered" | "Answered";
}

interface InterviewTreeCanvasProps {
    treeId: string;
}

const nodeTypes = {
    interviewQuestion: InterviewQuestionNode,
};

const NODE_WIDTH = 280;
const NODE_HEIGHT = 220;

function getLayoutedElements(
    nodes: Node[],
    edges: {
        id: string;
        source: string;
        target: string;
    }[]
) {
    const graph = new dagre.graphlib.Graph();

    graph.setDefaultEdgeLabel(() => ({}));

    graph.setGraph({
        rankdir: "TB",
        ranksep: 100,
        nodesep: 70,
    });

    nodes.forEach((node) => {
        graph.setNode(node.id, {
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
        });
    });

    edges.forEach((edge) => {
        graph.setEdge(
            edge.source,
            edge.target
        );
    });

    dagre.layout(graph);

    const layoutedNodes = nodes.map(
        (node) => {
            const position = graph.node(node.id);

            return {
                ...node,
                position: {
                    x:
                        position.x -
                        NODE_WIDTH / 2,
                    y:
                        position.y -
                        NODE_HEIGHT / 2,
                },
            };
        }
    );

    return layoutedNodes;
}

function InterviewTreeCanvas({
    treeId,
}: InterviewTreeCanvasProps) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<
        {
            id: string;
            source: string;
            target: string;
            type?: "smoothstep";
        }[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadNodes() {
            setLoading(true);
            setError("");

            console.log(
                "Loading interview nodes:",
                treeId
            );

            const {
                data,
                error: fetchError,
            } = await supabase
                .from("nodes")
                .select(
                    "id, parent_id, question, layer, category, difficulty, hook, status"
                )
                .eq("tree_id", treeId)
                .order("created_at", {
                    ascending: true,
                });

            console.log("Supabase result:", data);
            console.log(
                "Supabase error:",
                fetchError
            );

            if (cancelled) {
                return;
            }

            if (fetchError) {
                console.error(fetchError);

                setError(
                    fetchError.message ||
                    "Unable to load interview questions."
                );

                setLoading(false);

                return;
            }

            const databaseNodes =
                (data || []) as DatabaseNode[];

            const flowEdges = databaseNodes
                .filter((item) => item.parent_id)
                .map((item) => ({
                    id: `edge-${item.parent_id}-${item.id}`,
                    source: item.parent_id as string,
                    target: item.id,
                    type: "smoothstep" as const,
                }));

            console.log(
                "Number of nodes:",
                databaseNodes.length
            );

            const flowNodes: Node[] =
                databaseNodes.map(
                    (item, index) => ({
                        id: item.id,

                        type: "interviewQuestion",

                        position: {
                            x: (index % 3) * 360 + 100,
                            y:
                                Math.floor(index / 3) * 260 +
                                100,
                        },

                        data: {
                            question: item.question,
                            layer: item.layer,
                            category: item.category,
                            difficulty: item.difficulty,
                            hook: item.hook,
                            status:
                                item.status === "Answered"
                                    ? "Answered"
                                    : "Unanswered",
                        },
                    })
                );

            console.log(
                "React Flow nodes:",
                flowNodes
            );

            const layoutedNodes =
                getLayoutedElements(
                    flowNodes,
                    flowEdges
                );

            setNodes(layoutedNodes);
            setEdges(flowEdges);
            setLoading(false);
        }

        loadNodes();

        return () => {
            cancelled = true;
        };
    }, [treeId]);

    if (loading) {
        return (
            <div className="tree-canvas-state">
                Loading interview questions...
            </div>
        );
    }

    if (error) {
        return (
            <div className="tree-canvas-state tree-canvas-error">
                <h3>
                    Failed to load interview tree
                </h3>

                <p>{error}</p>
            </div>
        );
    }

    if (nodes.length === 0) {
        return (
            <div className="tree-canvas-state">
                No interview questions found.
            </div>
        );
    }

    return (
        <div
            style={{
                width: "100%",
                height: "calc(100vh - 180px)",
                minHeight: "600px",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                overflow: "hidden",
                background: "#f8fafc",
            }}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{
                    padding: 0.2,
                }}
            >
                <Background />

                <Controls />

                <MiniMap />
            </ReactFlow>
        </div>
    );
}

export default InterviewTreeCanvas;