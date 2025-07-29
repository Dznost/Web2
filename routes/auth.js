const express = require("express")
const router = express.Router()
const { body } = require("express-validator") // Import body for validation
const authController = require("../controllers/authController")

// Validation rules for registration
const registerValidation = [
    body("username").isLength({ min: 3 }).withMessage("Tên đăng nhập phải có ít nhất 3 ký tự"),
    body("email").isEmail().withMessage("Email không hợp lệ"),
    body("password").isLength({ min: 6 }).withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
    body("fullName").notEmpty().withMessage("Họ tên không được để trống"),
]

router.get("/login", authController.showLogin)
router.post("/login", authController.login)
router.get("/register", authController.showRegister) // Route để hiển thị form đăng ký
router.post("/register", registerValidation, authController.register) // Route để xử lý đăng ký
router.get("/logout", authController.logout)

module.exports = router
