import React, { useState } from "react";
import { User, Calendar, Mail, Lock, EyeOff, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient"; 
import './signUp.css';

function SignUp() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
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
            
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                    }
                }
            });

            
            if (error) {
                setErrorMessage(error.message);
                setIsLoading(false);
                return;
            }
 
            console.log("Supabase signup successful!", data);
            
            alert("Account created! Please check your email to verify your account.");
            navigate("/signin"); 

        } catch (error) {
            console.error("Unexpected error:", error);
            setErrorMessage("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return(
        <div className="signUp-container">
            <div className="signUp-content">
              
            <h1>Aura Study</h1>
            <p>Welcome to Aura Study. Create your account.</p>
                
            {errorMessage && <p style={{ color: "#ef4444", fontSize: "14px", marginBottom: "16px" }}>{errorMessage}</p>}
                
            <form onSubmit={handleSubmit}>
                <div className="name-container">
                <div className="name-input">
                    <User className="placeholder-icon-signup" size={18} />
                    <input
                        type="text"
                        value={formData.firstName}
                        placeholder="First Name"
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                         
                    />
                </div>
                <div className="name-input">
                    <User className="placeholder-icon-signup" size={18} />
                    <input
                        type="text"
                        value={formData.lastName}
                        placeholder="Last Name"
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        
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
    )
}

export default SignUp;