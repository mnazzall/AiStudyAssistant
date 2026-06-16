import React, { useState } from "react";
import { Mail, Lock, EyeOff, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { API_START_URL } from "../../config";
import './signIn.css'

function SignIn() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage("");

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) {
                setErrorMessage("Invalid email or password.");
                setIsLoading(false);
                return;
            }

            // Extract the JWT and save it to localStorage
            if (data.session && data.session.access_token) {
                const jwtToken = data.session.access_token;
                
                localStorage.setItem("user_jwt", jwtToken);
                console.log("Sign in successful! JWT saved.");
                
                // Fetch user profile from backend to get first name
                try {
                    const profileResponse = await fetch(`${API_START_URL}user/profile`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${jwtToken}`,
                            'ngrok-skip-browser-warning': 'true'
                        }
                    });

                    if (profileResponse.ok) {
                        const userData = await profileResponse.json();
                        localStorage.setItem("user_name", userData.firstName || userData.email);
                        localStorage.setItem("user_email", userData.email);
                    } else {
                        // Fallback: use email if profile fetch fails
                        localStorage.setItem("user_name", formData.email.split('@')[0]);
                        localStorage.setItem("user_email", formData.email);
                    }
                } catch (profileError) {
                    console.error("Error fetching profile:", profileError);
                    // Fallback: use email if fetch fails
                    localStorage.setItem("user_name", formData.email.split('@')[0]);
                    localStorage.setItem("user_email", formData.email);
                }
                
                // Route to the app
                navigate("/topics"); // Adjust to your main app route
            } else {
                setErrorMessage("Authentication failed: No token received.");
            }

        } catch (error) {
            console.error("Unexpected error:", error);
            setErrorMessage("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return(
        <div className="signIn-container">
            <div className="signIn-content">
              
            <h1>Aura Study</h1>
            <p>Welcome Back!</p>

            {errorMessage && <p style={{ color: "#ef4444", fontSize: "14px", marginBottom: "16px" }}>{errorMessage}</p>}
               
            <form onSubmit={handleSubmit}>
                <div>
                    <Mail className="placeholder-icon-signin" size={18} />
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        placeholder="Email Address"
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                    />
                </div>
                <div>
                    <Lock className="placeholder-icon-signin" size={18} />
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={formData.password}
                        placeholder="Password"
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        minLength={6}
                    />
                    {showPassword ? (
                        <Eye className="password-toggle-icon" size={18} onClick={() => setShowPassword(false)} />
                    ) : (
                        <EyeOff className="password-toggle-icon" size={18} onClick={() => setShowPassword(true)} />
                    )}
                </div>
                <div className="remember-forgot-container">
                <div className="remember-me">
                    <input type="checkbox" id="rememberMe" />
                    <label htmlFor="rememberMe">Remember Me</label>
                </div>
                <div className="forgot-password">
                    <a href="/forgot-password" className="forgot-password-link">Forgot Password?</a>
                </div>
                </div>
                
                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                </button>
            </form>

            <div className="signup-text">
                <p>Do not have an account? <a href="/signup">Sign up</a></p>
             </div>
            </div>

        </div>
    )
}

export default SignIn;