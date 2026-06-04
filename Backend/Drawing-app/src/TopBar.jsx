import React, { useState, useEffect } from 'react';
import {useNavigate} from "react-router-dom";

function DoodleGenerator(props)
{
  const navigate = useNavigate();
  async function handleLogout() {
    try {
      const resp = await axios.post(
      "http://localhost:3000/api/auth/logout",
      {},
      { withCredentials: true });
      navigate("/login");
    } 
    catch(err) {
        console.error("Backend logout cleanup failed:", err);
    } 
    finally {
        localStorage.removeItem("token");
        navigate("/login");
    }
  }
  return(
    <div>
      <h1 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        textAlign: 'center',
      }}>
        Voice to Doodle Feature
      </h1>
      <button
        onClick={handleLogout}
        style={{
            position: 'absolute',
            top: '30px', 
            right: '30px',
            backgroundColor: '#fb5956',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            zIndex: 50
          }}>
            Logout
        </button>
    </div>
  );
}

export default DoodleGenerator;