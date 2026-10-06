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

interface DatabaseNode {
    id: string;
    question: string;
    layer: number;
    category: string | null;
    difficulty: string | null;
}

interface InterviewTreeCanvasProps {
    treeId: string;
}

function InterviewTreeCanvas({
    treeId,
}: InterviewTreeCanvasProps) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadNodes() {
            console.log(
                "Fetching nodes for:",
                treeId
            );

            const {
                data,
                error: fetchError,
            } = await supabase
                .from("nodes")
                .select(
                    "id, question, layer, category, difficulty"
                )
                .eq("tree_id", treeId)
                .order("created_at", {
                    ascending: true,
                });

            console.log("Fetched data:", data);
            console.log(
                "Fetch error:",
                fetchError
            );

            if (fetchError) {
                setError(fetchError.message);
                setLoading(false);
                return;
            }

            const generatedNodes: Node[] =
                (data as DatabaseNode[]).map(
                    (item, index) => ({
                        id: item.id,

                        position: {
                            x: (index % 3) * 350 + 100,
                            y:
                                Math.floor(index / 3) * 250 +
                                100,
                        },

                        data: {
                            label: (
                                <div
                                    style={{
                                        padding: "16px",
                                        width: "280px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#64748b",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        LAYER {item.layer}
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "15px",
                                            fontWeight: 600,
                                            lineHeight: 1.4,
                                            color: "#0f172a",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        {item.question}
                                    </div>

                                    {item.category && (
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#475569",
                                            }}
                                        >
                                            {item.category}
                                        </div>
                                    )}

                                    {item.difficulty && (
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#64748b",
                                                marginTop: "5px",
                                            }}
                                        >
                                            Difficulty:{" "}
                                            {item.difficulty}
                                        </div>
                                    )}
                                </div>
                            ),
                        },

                        style: {
                            width: 280,
                            borderRadius: 14,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            boxShadow:
                                "0 4px 16px rgba(15, 23, 42, 0.12)",
                            padding: 0,
                        },
                    })
                );

            console.log(
                "React Flow nodes:",
                generatedNodes
            );

            setNodes(generatedNodes);
            setLoading(false);
        }

        loadNodes();
    }, [treeId]);

    if (loading) {
        return (
            <div
                style={{
                    height: "600px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                Loading interview questions...
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    height: "600px",
                    padding: "30px",
                    color: "#dc2626",
                }}
            >
                <h3>
                    Failed to load questions
                </h3>

                <p>{error}</p>
            </div>
        );
    }

    if (nodes.length === 0) {
        return (
            <div
                style={{
                    height: "600px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                No questions found.
            </div>
        );
    }

    return (
        <div
            style={{
                width: "100%",
                height: "600px",
                border: "3px solid blue",
                borderRadius: "16px",
                overflow: "hidden",
                background: "#f8fafc",
            }}
        >
            <ReactFlow
                nodes={nodes}
                fitView
            >
                <Background />

                <Controls />

                <MiniMap />
            </ReactFlow>
        </div>
    );
}

export default InterviewTreeCanvas;