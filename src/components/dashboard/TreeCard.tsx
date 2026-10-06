import { Trash2, ArrowRight } from "lucide-react";

import type { InterviewTree } from "../../types/tree";

interface TreeCardProps {
    tree: InterviewTree;
    progress: number;
    onOpen: () => void;
    onDelete: () => void;
}

function TreeCard({
    tree,
    progress,
    onOpen,
    onDelete,
}: TreeCardProps) {
    return (
        <div className="tree-card">
            <div className="tree-card-top">
                <div>
                    <h3>{tree.title}</h3>

                    <p className="tree-role">
                        {tree.role}
                    </p>
                </div>

                <button
                    className="icon-button danger"
                    onClick={onDelete}
                    title="Delete tree"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="tree-tags">
                <span className="tag">
                    {tree.interview_type}
                </span>

                <span className="tag">
                    {tree.level}
                </span>

                {tree.company && (
                    <span className="tag">
                        {tree.company}
                    </span>
                )}
            </div>

            <div className="tree-progress-section">
                <div className="tree-progress-header">
                    <span>Progress</span>

                    <span>{progress}%</span>
                </div>

                <div className="progress-track">
                    <div
                        className="progress-fill"
                        style={{
                            width: `${progress}%`,
                        }}
                    />
                </div>
            </div>

            <div className="tree-card-bottom">
                <span>
                    Updated{" "}
                    {new Date(
                        tree.updated_at
                    ).toLocaleDateString()}
                </span>

                <button
                    className="open-tree-button"
                    onClick={onOpen}
                >
                    Open
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}

export default TreeCard;