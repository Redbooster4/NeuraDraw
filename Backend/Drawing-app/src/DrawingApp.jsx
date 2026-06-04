import React,{ useRef, useState, useEffect, forwardRef } from "react";
import{ io } from "socket.io-client";

function DrawingApp(props, ref)
{
  // All state and refs
  const containerRef=useRef(null);
  const canvasRef=useRef(null);
  const ctxRef=useRef(null);
  const lastPointRef=useRef(null);
  const isDrawingRef=useRef(false);
  const socketRef=useRef(null);

  const [color, setColor]=useState("#000000");
  const [brushSize, setBrushSize]=useState(6);
  const [isEraser, setIsEraser]=useState(false);
  const [brushType, setBrushType]=useState('normal');
  const [isDarkMode, setIsDarkMode]=useState(false);

  const [aiSuggest, setIsAISuggest] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  useEffect(() =>{
    socketRef.current=io('http://localhost:3000', {
      transports: ["websocket", "polling"],
      withCredentials: true
    });

    const canvas=canvasRef.current;
    if(canvas)
   {
      const container=containerRef.current;
      const rect=container.getBoundingClientRect();
      const dpr=window.devicePixelRatio || 1;
      canvas.width=Math.max(1, rect.width * dpr);
      canvas.height=Math.max(1, rect.height * dpr);
      canvas.style.width=`${rect.width}px`;
      canvas.style.height=`${rect.height}px`;

      const ctx=canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      ctxRef.current=ctx;
   }

    socketRef.current.on('drawing', (data) =>{
      console.log(data);
      const{prevPoint, currentPoint, color, brushSize, brushType, isEraser}=data;
      const ctx=ctxRef.current;
      if (!ctx||!currentPoint) return;
      ctx.globalCompositeOperation=isEraser?"destination-out":"source-over";
      ctx.strokeStyle=color;
      ctx.lineWidth=brushSize;
      
      if(!prevPoint) 
     {
        ctx.beginPath();
        ctx.moveTo(currentPoint.x, currentPoint.y);
      }
      else{
        applyBrushType(ctx, brushType, prevPoint, currentPoint, brushSize, color);
      }
    });

    socketRef.current.on('ai_prediction', (data) => {
      setIsAnalyzing(false);
      if(data.predictions?.[0]){
        const top = data.predictions[0];
        setIsAISuggest({
          label: top.label.replace(/_/g, ' '),
          confidence: Math.round(top.score * 100)
        });
        setTimeout(() => setIsAISuggest(null), 4000);
      }
    });

    return ()=>{
      if (socketRef.current) {
        console.log('Disconnecting socket safely due to component unmount/reload...');
        socketRef.current.disconnect();
      }
    };
  }, []);

  const applyBrushType=(ctx, brushType, prevPoint, currentPoint, brushSize, color) =>{
    switch (brushType) 
    {
      case 'normal':{
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
        break; }
      case 'spray':{
        const density=brushSize;
        ctx.fillStyle=color;
        for (let i=0; i < density; i++){
          const offsetX=(Math.random() - 0.5) * brushSize;
          const offsetY=(Math.random() - 0.5) * brushSize;
          ctx.beginPath();
          ctx.arc(currentPoint.x + offsetX, currentPoint.y + offsetY, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'calligraphy':{
        const dx=currentPoint.x - prevPoint.x;
        const dy=currentPoint.y - prevPoint.y;
        const speed=Math.sqrt(dx * dx + dy * dy);
        ctx.lineWidth=brushSize * (1 - Math.min(speed / 20, 0.8));
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
        break;
      }
      case 'glow':{
        ctx.shadowColor=color;
        ctx.shadowBlur=brushSize;
        ctx.lineWidth=brushSize / 2;
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
        ctx.shadowBlur=0;
        break;
      }
    }
  };

  const getPoint=(e) =>{
    const canvas=canvasRef.current;
    const rect=canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches[0])
   {
      clientX=e.touches[0].clientX;
      clientY=e.touches[0].clientY;
    } 
    else{
      clientX=e.clientX;
      clientY=e.clientY;
    }
    return{x: clientX - rect.left, y: clientY - rect.top};
  };

  const startDrawing=(e) =>{
    document.body.style.overflow = "hidden";
    if(e.cancelable) e.preventDefault();
    const point=getPoint(e);
    isDrawingRef.current=true;
    lastPointRef.current=point;

    const ctx=ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    // console.log("Check", { 
    // hasSocketRef: !!socketRef.current, 
    // isConnected: socketRef.current?.connected 
    // });

    if(socketRef.current) 
   {
      socketRef.current.emit('drawing',{
        prevPoint: null,
        currentPoint: point,
        color, brushSize, brushType, isEraser
      });
    }
  };

  const draw=(e) =>{
    if(e.cancelable) e.preventDefault();
    if(!isDrawingRef.current) return;
    const point=getPoint(e);
    const lastPoint=lastPointRef.current;
    
    const ctx=ctxRef.current;
    ctx.lineWidth=brushSize;
    ctx.globalCompositeOperation=isEraser?"destination-out":"source-over";
    ctx.strokeStyle=color;
    
    if(lastPoint){
      applyBrushType(ctx, brushType, lastPoint, point, brushSize, color);
    }
    // console.log("Check", { 
    // hasSocketRef: !!socketRef.current, 
    // isConnected: socketRef.current?.connected 
    // });
    if(socketRef.current && lastPoint)
    {
      socketRef.current.emit('drawing',{
        prevPoint: lastPoint,
        currentPoint: point,
        color, brushSize, brushType, isEraser
      });
    }
    lastPointRef.current=point;
  };

  const preprocessForQuickDraw = (sourceCanvas) => {
    const temp = document.createElement('canvas');
    temp.width = 224//sourceCanvas.width;
    temp.height = 224//sourceCanvas.height;
    const ctx = temp.getContext('2d');
    
    ctx.fillStyle='#FFFFFF';
    ctx.fillRect(0, 0, 224, 224);//temp.width, temp.height);
    ctx.drawImage(sourceCanvas, 0, 0, 224, 224);//sourceCanvas.width, sourceCanvas.height);
    return temp;
  };

  const getCanvasBlob=(canvasElement, format="image/jpeg", quality=0.9) => {
    return new Promise((resolve)=>{
      canvasElement.toBlob((blob)=>resolve(blob), format, quality);
    });
  };

  const stopDrawing= async () =>{
    if(!isDrawingRef.current) return;
    isDrawingRef.current=false;
    ctxRef.current.closePath();
  
    const canvas=canvasRef.current;
    const dataURL=canvas.toDataURL(canvas, 0.9);

    // console.log("Check", { 
    // hasSocketRef: !!socketRef.current, 
    // isConnected: socketRef.current?.connected 
    // });

    if(socketRef.current){
      try{
        const aiReadyCanvas = preprocessForQuickDraw(canvas);
        const imageBlob = await getCanvasBlob(aiReadyCanvas, "image/jpeg", 0.9);

        //debug
        // const debugBlob = await getCanvasBlob(aiReadyCanvas, "image/jpeg", 0.9);
        // const url = URL.createObjectURL(debugBlob);
        // const a = document.createElement('a');
        // a.href = url;
        // a.download = 'debug_sketch.jpg';
        // a.click();
        //
        if(imageBlob){
          socketRef.current.emit("stroke_completed", {imageSnapshot: dataURL});
        }
      }
      catch(blobError){
        console.log("Failed to generate or emit Blob", blobError);
      }
    }
  };

  const clearCanvas=() =>{
    const canvas=canvasRef.current;
    const ctx=canvas.getContext("2d");
    const cssW=canvas.width / (window.devicePixelRatio || 1);
    const cssH=canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, cssW, cssH);
    const dataURL=canvas.toDataURL("image/png", 1.0);
  };

  //PNG format
  const saveImage=() =>{
    const canvas=canvasRef.current;
    const dataURL=canvas.toDataURL("image/png", 1.0);
    const link=document.createElement("a");
    link.href=dataURL;
    link.download=`drawing_${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const toggleEraser=() => setIsEraser((v) => !v);
  const toggleDarkMode=() => setIsDarkMode((v) => !v);

  return(
    <div className={`flex flex-col min-h-screen w-full transition-colors ${
      isDarkMode?"bg-gray-900 text-white":"bg-white text-gray-900"}`}>
      
      <div className={`mb-3 flex flex-wrap justify-center gap-3 items-center p-3 rounded-lg ${
        isDarkMode?"bg-gray-800":"bg-gray-50"
      }`}>

        <label className={`text-sm font-medium ${isDarkMode?"text-white":"text-gray-900"}`}>
          Color:
        </label>
        <input
          aria-label="Brush color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-10 h-8 rounded cursor-pointer border"
        />

        <label className={`text-sm font-medium ${isDarkMode?"text-white":"text-gray-900"}`}>
          Brush: 
        </label>
        <select
          value={brushType}
          onChange={(e) => setBrushType(e.target.value)}
          className={`px-2 py-1 border rounded text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDarkMode 
             ?"bg-gray-700 text-white border-gray-600" 
             :"bg-white border-gray-300"
          }`}>
          <option value="normal">Normal</option>
          <option value="spray">Spray</option>
          <option value="calligraphy">Calligraphy</option>
          <option value="glow">Glow</option>
        </select>

        <label className={`text-sm font-medium ${isDarkMode?"text-white":"text-gray-900"}`}>
          Brush Size:
        </label>
        <input
          aria-label="Brush size"
          type="range"
          min={1}
          max={80}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-32 accent-blue-500 cursor-pointer"
        />
        <span className={`${isDarkMode?"text-white":"text-gray-900"}`}>
          {brushSize}px
        </span>

        <button
          className={`px-4 py-1 rounded-md border shadow-sm transition ${
            isEraser
              ?isDarkMode 
                ?"bg-gray-600 text-white border-gray-500" 
                :"bg-gray-300 text-gray-900"
              :isDarkMode
                ?"bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                :"bg-white hover:bg-gray-100"
          }`}
          onClick={toggleEraser}
          title="Toggle eraser">
          Eraser
        </button>
        
        <button
          className={`px-4 py-1 rounded-md border shadow-sm transition ${
            isDarkMode
              ?"bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              :"bg-white hover:bg-gray-100"
          }`}
          onClick={clearCanvas}
          title="Clear canvas">
          Clear all
        </button>
        
        <button
          className="px-4 py-1 rounded-md border shadow-sm bg-green-500 text-white hover:bg-green-600 transition"
          onClick={saveImage}
          title="Save as PNG">
          Save PNG
        </button>

        <button
          className={`px-4 py-1 rounded-md border shadow-sm transition`}
          style={{background: isDarkMode?"#1E1E1E":"white"}}
          onClick={toggleDarkMode}
          title="Toggle dark mode">
          {isDarkMode?"🌞":"🌙"}
        </button>
      </div>

      <div
        ref={containerRef}
        className={`flex-1 shadow-lg overflow-y-auto p-2 transition-all ${
          isDarkMode?"bg-gray-800 border-gray-600":"bg-white"
        }`}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ 
            display: "block", 
            background: isDarkMode?"#1E1E1E":"white", 
            border: `1px solid ${isDarkMode?"#4b5563":"black"}`, 
            borderRadius: '8px', 
            cursor: 'crosshair'
          }}
        />
      </div>

      {(isAnalyzing || aiSuggest) && (
      <div className={`absolute bottom-4 right-4 px-4 py-3 rounded-xl font-semibold shadow-lg z-50 flex items-center gap-2 transition-all duration-300 ${
        isAnalyzing 
          ? (isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white')
          : (isDarkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white')
      }`}>
        {isAnalyzing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            AI Thinking...
          </>
        ) : (
          <>
            ✨ "{aiSuggest?.label}"
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
              {aiSuggest?.confidence}%
            </span>
          </>
        )}
      </div>
    )}
    </div>
  );
}
export default forwardRef(DrawingApp);
