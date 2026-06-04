// test-backend.js
const { io } = require("socket.io-client");

// 🔧 Configuration
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";

// 🖼️ Valid 1x1 red PNG base64 (prevents the 0.0KB error)
const TEST_IMAGE_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

console.log(`🔌 Connecting to ${SERVER_URL}...`);

const socket = io(SERVER_URL, {
  transports: ["websocket"],
  forceNew: true,
});

socket.on("connect", () => {
  console.log(`✅ Connected! Socket ID: ${socket.id}\n`);

  // 1️⃣ Simulate drawing strokes
  console.log("🎨 Sending drawing points...");
  for (let i = 0; i < 15; i++) {
    socket.emit("drawing", {
      currentPoint: { x: 100 + i * 10, y: 150 + Math.sin(i) * 20 }
    });
  }
  console.log("   Sent 15 points.\n");

  // 2️⃣ Send stroke_completed after a short delay
  setTimeout(() => {
    console.log("🖼️  Sending stroke_completed with test image...");
    socket.emit("stroke_completed", {
      imageSnapshot: TEST_IMAGE_BASE64,
      strokeId: "test-stroke-1",
      timestamp: Date.now(),
    });
  }, 1000);
});

// 🤖 Listen for AI predictions
socket.on("ai_prediction", (data) => {
  console.log("\n🤖 AI Prediction Received:");
  console.log(JSON.stringify(data, null, 2));
  
  if (data.predictions && data.predictions.length > 0) {
    const top = data.predictions[0];
    console.log(`✨ Top guess: "${top.label}" (${Math.round(top.score * 100)}% confidence)`);
  }
  
  // Clean exit after receiving response
  setTimeout(() => socket.disconnect(), 2000);
});

// 🔌 Handle disconnect & errors
socket.on("disconnect", (reason) => {
  console.log(`\n🔌 Disconnected: ${reason}`);
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection failed:", err.message);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down...");
  socket.disconnect();
  process.exit(0);
});