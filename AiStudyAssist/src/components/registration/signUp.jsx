import React, { useState } from "react";
import { User, Calendar, Mail, Lock, EyeOff, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { API_START_URL } from "../../config";
import './signUp.css';

function SignUp() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        dob: "",
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
          
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        dob: formData.dob
                    }
                }
            });

            if (authError) {
                setErrorMessage(authError.message);
                setIsLoading(false);
                return;
            }

            
            if (authData.session && authData.session.access_token) {
                const jwtToken = authData.session.access_token;
                
                // Persist session state locally
                localStorage.setItem("user_jwt", jwtToken);
                localStorage.setItem("user_name", formData.firstName);
                localStorage.setItem("user_email", formData.email);
                
                console.log("Request 1 (Supabase): Successful! JWT captured.");

                
                try {
                    const syncPayload = {
                        email: formData.email,
                        password: formData.password,
                        data: {
                            first_name: formData.firstName,
                            last_name: formData.lastName,
                            dob: formData.dob
                        }
                    };

                    const syncResponse = await fetch(`${API_START_URL}users/sync`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${jwtToken}`,
                            'ngrok-skip-browser-warning': 'true'
                        },
                        body: JSON.stringify(syncPayload)
                    });

                    if (!syncResponse.ok) {
                        const errorDetails = await syncResponse.text();
                        console.error("Request 2 (Backend Sync): Failed status ->", syncResponse.status, errorDetails);
                        setErrorMessage("Account secured in Supabase, but backend synchronization failed.");
                        setIsLoading(false);
                        return;
                    }

                    console.log("Request 2 (Backend Sync): User successfully registered in backend database.");
                    navigate("/topics");

                } catch (syncError) {
                    console.error("Network error connecting to backend sync endpoint:", syncError);
                    setErrorMessage("Account secured, but failed to connect to backend synchronization server.");
                }

            } else {
               
                setErrorMessage("Account registered! Please check your email inbox to verify your account and log in.");
            }

        } catch (error) {
            console.error("Unexpected registration error:", error);
            setErrorMessage("An unexpected registration error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return(
        <div className="signUp-container">
            <div className="signUp-content">
                <img 
                    src="./src/assets/Photos/logo2.png"  
                    alt="Brainfy Logo"
                />
                <h1>Brainfy</h1>
                <p>Welcome to Brainfy. Create your account.</p>
                    
                {errorMessage && <p className="error-message" style={{ color: "#ef4444", fontSize: "14px", marginBottom: "16px" }}>{errorMessage}</p>}
                    
                <form onSubmit={handleSubmit}>
                    <div className="name-container">
                        <div className="name-input">
                            <User className="placeholder-icon-signup" size={18} />
                            <input
                                type="text"
                                value={formData.firstName}
                                placeholder="First Name"
                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                required
                            />
                        </div>
                        <div className="name-input">
                            <User className="placeholder-icon-signup" size={18} />
                            <input
                                type="text"
                                value={formData.lastName}
                                placeholder="Last Name"
                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="dob-container">
                        <h3>Date of Birth</h3>
                        <div className="dob-input">
                            <Calendar className="placeholder-icon-signup" size={18} />
                            <input
                                type="date"
                                value={formData.dob}
                                onChange={(e) => setFormData({...formData, dob: e.target.value})}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div>
                        <Mail className="placeholder-icon-signup" size={18} />
                        <input
                            type="email"
                            value={formData.email}
                            placeholder="Email Address"
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                        />
                    </div>

                    <div>
                        <Lock className="placeholder-icon-signup" size={18} />
                        <input
                            type={showPassword ? "text" : "password"}
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
                    
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>

                <div className="signin-text">
                    <p>Already have an account? <a href="/signin">Sign in</a></p>
                </div>
            </div>
        </div>
    );
}

export default SignUp;