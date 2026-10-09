import { useEffect, useState } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    type Node,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import AnswerPanel from "../interview/AnswerPanel";
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
    user_answer: string | null;
    evaluation: {
        score?: number;
        rating?: string;
        summary?: string;
        strengths?: string[];
        weaknesses?: string[];
        missingPoints?: string[];
        feedback?: string;
    } | null;
}

interface TreeMetadata {
    role: string;
    level: string;
    interview_type: string;
    resume_profile: Record<string, unknown> | null;
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
    const [databaseNodes, setDatabaseNodes] = useState<DatabaseNode[]>([]);
    const [selectedNode, setSelectedNode] = useState<DatabaseNode | null>(null);
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
    const [treeMetadata, setTreeMetadata] =
        useState<TreeMetadata | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);


    useEffect(() => {
        let cancelled = false;

        async function loadNodes() {
            setLoading(true);
            const { data: treeData, error: treeError } = await supabase
                .from("trees")
                .select("role, level, interview_type, resume_profile")
                .eq("id", treeId)
                .single();

            if (treeError) {
                setError(treeError.message);
                setLoading(false);
                return;
            }

            setTreeMetadata(treeData as TreeMetadata);
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
                    "id, parent_id, question, layer, category, difficulty, hook, status, user_answer, evaluation"
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

            setDatabaseNodes(databaseNodes);

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
                            height: "calc(100vh - 180px)",
                            minHeight: "600px",
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
    }, [treeId, refreshKey]);

    async function handleSubmitAnswer(answer: string) {
        if (!selectedNode || !treeMetadata || submitting) {
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const { data, error: functionError } =
                await supabase.functions.invoke("evaluate-and-expand", {
                    body: {
                        question: selectedNode.question,
                        userAnswer: answer,
                        role: treeMetadata.role,
                        level: treeMetadata.level,
                        interviewType: treeMetadata.interview_type,
                        resumeProfile: treeMetadata.resume_profile,
                    },
                });

            if (functionError) {
                throw functionError;
            }

            if (!data?.success || !data?.data) {
                throw new Error(
                    data?.error || "Unable to evaluate your answer."
                );
            }

            const { evaluation, followUps } = data.data;

            const { error: updateError } = await supabase
                .from("nodes")
                .update({
                    user_answer: answer,
                    evaluation,
                    status: "Answered",
                })
                .eq("id", selectedNode.id);

            if (updateError) {
                throw updateError;
            }


            console.log("Evaluation saved:", evaluation);

            if (!Array.isArray(followUps) || followUps.length === 0) {
                setSelectedNode(null);
                alert("Answer evaluated and saved. No follow-up questions were generated.");
                return;
            }

            const followUpNodes = followUps.map((item: {
                question: string;
                hook?: string;
                category?: string;
                branchType?: string;
                difficulty?: string;
                idealAnswerOutline?: string[];
            }) => ({
                tree_id: treeId,
                parent_id: selectedNode.id,
                layer: selectedNode.layer + 1,
                question: item.question,
                hook: item.hook ?? null,
                category: item.category ?? null,
                branch_type: item.branchType ?? null,
                difficulty: item.difficulty ?? null,
                ideal_answer_outline: item.idealAnswerOutline ?? [],
                status: "Unanswered" as const,
            }));

            const { error: insertError } = await supabase
                .from("nodes")
                .insert(followUpNodes);

            if (insertError) {
                throw insertError;
            }

            setSelectedNode(null);
            setRefreshKey((previous) => previous + 1);
            alert(`Answer saved! ${followUpNodes.length} follow-up questions added.`);

        } catch (error) {
            console.error("Answer submission failed:", error);

            alert(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while evaluating your answer."
            );
        } finally {
            setSubmitting(false);
        }
    }

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
                position: "relative",
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
                onNodeClick={(_, node) => {
                    const selected = databaseNodes.find(
                        (item) => item.id === node.id
                    );

                    if (selected) {
                        setSelectedNode(selected);
                    }
                }}
            >
                <Background />

                <Controls />

                <MiniMap />
            </ReactFlow>

            {selectedNode && (
                <AnswerPanel
                    question={selectedNode.question}
                    status={selectedNode.status}
                    savedAnswer={selectedNode.user_answer}
                    evaluation={
                        selectedNode.evaluation &&
                            typeof selectedNode.evaluation === "object"
                            ? selectedNode.evaluation as {
                                score?: number;
                                rating?: string;
                                summary?: string;
                                strengths?: string[];
                                weaknesses?: string[];
                                missingPoints?: string[];
                                feedback?: string;
                            }
                            : null
                    }
                    onClose={() => setSelectedNode(null)}
                    onSubmit={handleSubmitAnswer}
                    submitting={submitting}
                />
            )}

        </div>
    );
}

export default InterviewTreeCanvas;