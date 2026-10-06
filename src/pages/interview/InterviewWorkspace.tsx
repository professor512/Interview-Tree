import { useParams } from "react-router-dom";

function InterviewWorkspace() {
    const { treeId } = useParams();

    return (
        <div className="workspace-page">
            <h1>Interview Workspace</h1>

            <p>
                Tree ID: {treeId}
            </p>
        </div>
    );
}

export default InterviewWorkspace;