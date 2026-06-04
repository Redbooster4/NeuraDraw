import React from "react";
import DrawingApp from "./DrawingApp";
import TopBar from "./TopBar";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";

function App() {
  const drawingRef = React.useRef();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace/>}/>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
              <div className="w-full max-w-7xl mx-auto mb-6">
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-200">
                  <h1 className="text-3xl font-bold text-center text-gray-800 mb-4 tracking-tight">
                    AI - Powered Drawing App
                  </h1>
                  <TopBar/>
                </div>
              </div>

              <div className="w-full max-w-7xl mx-auto">
                <div
                  className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200 flex"
                  style={{ height: "80vh" }}
                >
                  <div className="flex-1">
                    <DrawingApp ref={drawingRef} />
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;