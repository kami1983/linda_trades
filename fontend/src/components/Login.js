import React, { useState, useEffect } from "react";
import { useLoginStatus } from "../context/LoginStautsContext";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const apiHost = process.env.REACT_APP_API_HOSTS;
    const {updateLoginStatus, isLoggedIn, currentUsername} = useLoginStatus();

    // 检查用户是否已登录
    useEffect(() => {
    }, []);

    const handleLogin = async () => {
        const response = await fetch(`${apiHost}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password }),
            credentials: "include" // 确保登录信息存储到 cookies
        });

        if (response.ok) {
            updateLoginStatus();
        } else {
            alert("Invalid credentials");
        }
    };

    const handleProtected = async () => {
        const response = await fetch(`${apiHost}/protected`, {
            method: "GET",
            credentials: "include" // 确保携带 cookies
        });

        const data = await response.json();
        alert(data.message || data.error);
    };

    const handleLogout = async () => {
        await fetch(`${apiHost}/logout`, {
            method: "POST",
            credentials: "include"
        });
        updateLoginStatus();
    };

    return (
        <div>
            {isLoggedIn ? (
                <div>
                    <button onClick={handleLogout}>Logout [{currentUsername}]</button>
                </div>
            ) : (
                <div>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button onClick={handleLogin}>Login</button>
                </div>
            )}
        </div>
    );
}

export default Login;
