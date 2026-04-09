import React,{useState} from "react";
import { User, Calendar, Mail, Lock, EyeOff, Eye } from "lucide-react";
import './signUp.css'

function SignUp() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });
    
    return(
        <div className="signUp-container">
            <div className="signUp-content">
              
            <h1>Aura Study</h1>
            <p>Welcome to Aura Study. Create your account.</p>
               
            <form>
                <div className="name-container">
                <div className="name-input">
                    <User className="placeholder-icon" size={18} />
                    <input
                        type="text"
                        value={formData.firstName}
                        placeholder="First Name"
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                </div>
                <div className="name-input">
                    <User className="placeholder-icon" size={18} />
                    <input
                        type="text"
                        value={formData.lastName}
                        placeholder="Last Name"
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                </div>
                </div>
                <div>
                    <Mail className="placeholder-icon" size={18} />
                    <input
                        type="email"
                        value={formData.email}
                        placeholder="Email Address"
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                </div>
                <div>
                    <Lock className="placeholder-icon" size={18} />
                    <input
                        type="password"
                        value={formData.password}
                        placeholder="Password"
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                </div>
                <button type="submit">Sign Up</button>
            </form>
            <div className="signin-text">
                <p>Already have an account? <a href="/signin">Sign in</a></p>
                </div>
            </div>
        </div>
    )}

    export default SignUp;