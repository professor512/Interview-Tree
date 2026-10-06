import { useEffect, useState } from "react";
import { Plus, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

import TreeCard from "../../components/dashboard/TreeCard";

import type { InterviewTree } from "../../types/tree";

function Dashboard() {
    const navigate = useNavigate();

    const { user, signOut } = useAuth();

    const [trees, setTrees] = useState<InterviewTree[]>([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    async function loadTrees() {
        if (!user) {
            return;
        }

        setLoading(true);
        setError("");

        const {
            data,
            error: fetchError,
        } = await supabase
            .from("trees")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", {
                ascending: false,
            });

        if (fetchError) {
            console.error(fetchError);

            setError(
                "Unable to load your interview trees."
            );

            setLoading(false);

            return;
        }

        setTrees(data as InterviewTree[]);

        setLoading(false);
    }

    useEffect(() => {
        loadTrees();
    }, [user]);

    async function handleDelete(treeId: string) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this interview tree?"
        );

        if (!confirmed) {
            return;
        }

        const {
            error: deleteError,
        } = await supabase
            .from("trees")
            .delete()
            .eq("id", treeId);

        if (deleteError) {
            console.error(deleteError);

            alert(
                "Unable to delete the interview tree."
            );

            return;
        }

        setTrees((currentTrees) =>
            currentTrees.filter(
                (tree) => tree.id !== treeId
            )
        );
    }

    async function handleLogout() {
        await signOut();
    }

    return (
        <div className="dashboard-page">
            {/* HEADER */}

            <header className="dashboard-header">
                <div className="brand">
                    <h1>InterviewTree</h1>

                    <span>
                        AI Mock Interviews
                    </span>
                </div>

                <div className="dashboard-user">
                    <span>
                        {user?.user_metadata?.full_name ||
                            user?.email}
                    </span>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                        title="Sign out"
                    >
                        <LogOut size={17} />

                        Sign out
                    </button>
                </div>
            </header>

            {/* MAIN */}

            <main className="dashboard-content">
                <div className="dashboard-title-row">
                    <div>
                        <h2>Your Interview Trees</h2>

                        <p>
                            Practice interviews based on your
                            resume and follow your personalised
                            interview paths.
                        </p>
                    </div>

                    <button
                        className="new-tree-button"
                        onClick={() =>
                            navigate("/trees/new")
                        }
                    >
                        <Plus size={18} />

                        New Tree
                    </button>
                </div>

                {/* ERROR */}

                {error && (
                    <div className="dashboard-error">
                        {error}

                        <button
                            onClick={loadTrees}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* LOADING */}

                {loading && (
                    <div className="dashboard-loading">
                        <p>
                            Loading your interview trees...
                        </p>
                    </div>
                )}

                {/* EMPTY */}

                {!loading &&
                    trees.length === 0 && (
                        <div className="dashboard-empty">
                            <div className="empty-icon">
                                +
                            </div>

                            <h3>
                                Your interview journey starts here
                            </h3>

                            <p>
                                Upload your resume and let AI
                                create a personalised interview
                                tree for you.
                            </p>

                            <button
                                className="new-tree-button"
                                onClick={() =>
                                    navigate("/trees/new")
                                }
                            >
                                <Plus size={18} />

                                Create your first tree
                            </button>
                        </div>
                    )}

                {/* TREE GRID */}

                {!loading &&
                    trees.length > 0 && (
                        <div className="tree-grid">
                            {trees.map((tree) => (
                                <TreeCard
                                    key={tree.id}
                                    tree={tree}
                                    progress={0}
                                    onOpen={() =>
                                        navigate(
                                            `/trees/${tree.id}`
                                        )
                                    }
                                    onDelete={() =>
                                        handleDelete(tree.id)
                                    }
                                />
                            ))}
                        </div>
                    )}
            </main>
        </div>
    );
}

export default Dashboard;