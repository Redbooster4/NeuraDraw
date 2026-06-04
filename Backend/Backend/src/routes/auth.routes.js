const express = require("express")
const router = express.Router()
const authController = require("../controllers/auth.controller")

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/getUser", authController.getUser);
router.post("/getToken", authController.getAccessToken);
router.post("/logout", authController.logoutUser);
router.post("/verify", authController.verifyEmail);

module.exports = router;