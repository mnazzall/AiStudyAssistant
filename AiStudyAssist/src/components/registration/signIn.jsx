import React,{useState} from "react";
import { Mail, Lock, EyeOff, Eye } from "lucide-react";
import './signIn.css'

function SignIn() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    
    return(
        <div className="signIn-container">
            <div className="signIn-content">
              
            <h1>Aura Study</h1>
            <p>Welcome Back!</p>
               
            <form>
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
                <button type="submit">Sign In</button>
            </form>

            <div className="signup-text">
                <p>Do not have an account? <a href="/signup">Sign up</a></p>
             </div>
            </div>

        </div>
    )}

    export default SignIn;