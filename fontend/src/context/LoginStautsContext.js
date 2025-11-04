import React, { createContext, useContext, useEffect, useState } from 'react';

const LoginStatusContext = createContext();

export const LoginStatusProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUsername, setCurrentUsername] = useState("");
    const [isChecking, setIsChecking] = useState(true);
    
    const apiHost = process.env.REACT_APP_API_HOSTS;

    // 定义一个更新登录状态的方法
    const updateLoginStatus = async () => {
        setIsChecking(true);
        try {
            const response = await fetch(`${apiHost}/current_user`, {
                method: "GET",
                credentials: "include"
            });
            if (!response.ok) {
                throw new Error("Failed to fetch login status");
            }
            const data = await response.json();
            if (data.status) {
                setIsLoggedIn(true);
                setCurrentUsername(data.data.username);
            } else {
                setIsLoggedIn(false);
                setCurrentUsername("");
            }
        } catch (error) {
            console.error("Error checking login status:", error);
            setIsLoggedIn(false);
            setCurrentUsername("");
        }
        finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        // 初始化时检查登录状态
        updateLoginStatus();
    }, [apiHost]);

    return (
        <LoginStatusContext.Provider value={{ isLoggedIn, currentUsername, updateLoginStatus, isChecking }}>
            {children}
        </LoginStatusContext.Provider>
    );
};

export const useLoginStatus = () => {
    return useContext(LoginStatusContext);
};
