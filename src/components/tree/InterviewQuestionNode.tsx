import {
    Handle,
    Position,
    type NodeProps,
} from "@xyflow/react";

interface InterviewQuestionNodeData {
    question: string;
    layer: number;
    category: string | null;
    difficulty: string | null;
    hook: string | null;
    status: "Unanswered" | "Answered";
}

function InterviewQuestionNode({
    data,
}: NodeProps) {
    const nodeData =
        data as unknown as InterviewQuestionNodeData;

    return (
        <div className="interview-question-node">
            <Handle
                type="target"
                position={Position.Top}
                className="tree-node-handle"
            />

            <div className="tree-node-header">
                <span className="tree-node-layer">
                    Layer {nodeData.layer}
                </span>

                {nodeData.difficulty && (
                    <span
                        className={`tree-node-difficulty ${nodeData.difficulty.toLowerCase()}`}
                    >
                        {nodeData.difficulty}
                    </span>
                )}
            </div>

            <div className="tree-node-question">
                {nodeData.question}
            </div>

            {nodeData.category && (
                <div className="tree-node-category">
                    {nodeData.category}
                </div>
            )}

            {nodeData.hook && (
                <div className="tree-node-hook">
                    <strong>Why asked:</strong>{" "}
                    {nodeData.hook}
                </div>
            )}

            <div
                className={`tree-node-status ${nodeData.status.toLowerCase()}`}
            >
                <span className="tree-node-status-dot" />

                {nodeData.status}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="tree-node-handle"
            />
        </div>
    );
}

export default InterviewQuestionNode;