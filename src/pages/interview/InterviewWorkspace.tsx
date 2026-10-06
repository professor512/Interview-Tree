import { useParams } from "react-router-dom";

import InterviewTreeCanvas from "../../components/tree/InterviewTreeCanvas";

function InterviewWorkspace() {
    const { treeId } = useParams();

    if (!treeId) {
        return (
            <div className="workspace-page">
                <h1>Interview Workspace</h1>

                <p>
                    No interview tree was specified.
                </p>
            </div>
        );
    }

    return (
        <div className="workspace-page">
            <div className="workspace-header">
                <div>
                    <h1>Interview Workspace</h1>

                    <p>
                        Explore your personalised interview tree.
                    </p>
                </div>

                <div className="workspace-tree-id">
                    Tree ID: {treeId}
                </div>
            </div>

            <div className="workspace-content">
                <InterviewTreeCanvas treeId={treeId} />
            </div>
        </div>
    );
}

export default InterviewWorkspace;