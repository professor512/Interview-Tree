import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

function Signup() {
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSignup(event: React.FormEvent) {
        event.preventDefault();

        setError("");
        setLoading(true);

        const {
            data,
            error: signupError,
        } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (signupError) {
            setError(signupError.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            navigate("/dashboard");
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Create your account</h1>
                    <p>Build personalised interview trees from your resume.</p>
                </div>

                <form onSubmit={handleSignup}>
                    <div className="form-group">
                        <label htmlFor="fullName">Full name</label>

                        <input
                            id="fullName"
                            type="text"
                            placeholder="Your name"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>

                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>

                        <input
                            id="password"
                            type="password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            minLength={6}
                            required
                        />
                    </div>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <div className="auth-footer">
                    <span>Already have an account?</span>

                    <Link to="/login">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Signup;