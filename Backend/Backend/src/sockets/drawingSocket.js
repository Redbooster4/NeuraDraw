require("dotenv").config();
//const { pipeline, RawImage } = require("@xenova/transformers");
const userStrokes = {};
const { RawImage, pipeline } = require("@huggingface/transformers");
const fs = require("fs");

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log(`User Connected to the drawing room: ${socket.id}`);
    userStrokes[socket.id] = [];

    socket.on("drawing", (data) => {
      //console.log(`Socket Event Received: id:${socket.id}, X:${data.currentPoint?.x}, Y:${data.currentPoint?.y}`)
      socket.broadcast.emit("drawing", data);

      if (data.currentPoint) {
        userStrokes[socket.id].push(data.currentPoint);
      }
    });

    socket.on("stroke_completed", async (data) => {
      try {
        const points = userStrokes[socket.id];
        let imageSnapshot = data.imageSnapshot;
        if (!points || points.length < 5) return;
        if (!imageSnapshot) {
          console.log("No Image Data Received from FRONTEND");
          return;
        }
        //console.log(`Analyzing complete stroke for user ${socket.id}`);

        const localPipe = await pipeline(
          "image-classification",
          "Xenova/quickdraw-mobilevit-small",
        );
        imageSnapshot = imageSnapshot.trim();

        const base64 = imageSnapshot.replace(/^data:image\/[a-z]+;base64,/, "");
        const buffer = Buffer.from(base64, "base64");
        const blob = new Blob([buffer], { type: "image/png" });
        let image = await RawImage.fromBlob(blob);
        image = image.grayscale();
        //console.log(imageSnapshot);
        fs.writeFileSync("debug.png", buffer);

        //console.log(pipe);
        let aiSuggestions;
        try {
          aiSuggestions = await localPipe(image, { top_k: 1 });
        } catch (err) {
          if (err.message.includes("logits is not iterable")) {
            aiSuggestions = [{ label: "User Doodle", score: 1.0 }];
          } else {
            throw err;
          }
        }
        console.log("AI: ", aiSuggestions);
        socket.emit("ai_prediction", {
          predictions: aiSuggestions,
        });
      } catch (error) {
        console.log("AI analysis", error);
      } finally {
        userStrokes[socket.id] = [];
      }
    });

    socket.on("disconnect", () => {
      delete userStrokes[socket.id];
      console.log(`User disconnected ${socket.id}`);
    });
  });
};
