const User = require("../models/User")
const { validationResult } = require("express-validator")

exports.showLogin = (req, res) => {
    const error = req.query.error === "banned" ? "Tài khoản của bạn đã bị cấm" : null
    const success = req.query.success === "registered" ? true : false
    res.render("auth/login", { title: "Đăng nhập", error, success })
}

exports.showRegister = (req, res) => {
    res.render("auth/register", { title: "Đăng ký", error: null })
}

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body
        console.log(`[Auth Controller] Login attempt for username: ${username}`)
        console.log(`[Auth Controller] Password received from form: ${password}`) // KHÔNG NÊN LOG MẬT KHẨU TRONG MÔI TRƯỜNG THỰC TẾ! Chỉ dùng để debug.

        const user = await User.findOne({ username })
        if (!user) {
            console.log(`[Auth Controller] User ${username} not found.`)
            return res.render("auth/login", {
                title: "Đăng nhập",
                error: "Tên đăng nhập không tồn tại",
                success: false,
            })
        }

        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            console.log(`[Auth Controller] Password mismatch for user ${username}.`)
            return res.render("auth/login", {
                title: "Đăng nhập",
                error: "Mật khẩu không chính xác",
                success: false,
            })
        }

        if (user.isBanned()) {
            console.log(`[Auth Controller] User ${username} is banned.`)
            return res.render("auth/login", {
                title: "Đăng nhập",
                error: `Tài khoản bị cấm đến ${user.bannedUntil.toLocaleDateString("vi-VN")}. Lý do: ${user.bannedReason || "Không có"}`,
                success: false,
            })
        }

        req.session.user = {
            id: user._id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
        }
        console.log(`[Auth Controller] User ${username} logged in successfully. Role: ${user.role}`)
        res.redirect("/")
    } catch (error) {
        console.error("[Auth Controller] Server error during login:", error)
        res.render("auth/login", {
            title: "Đăng nhập",
            error: "Lỗi server",
            success: false,
        })
    }
}

exports.register = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.render("auth/register", {
                title: "Đăng ký",
                error: errors.array()[0].msg,
            })
        }

        const { username, email, password, fullName, role } = req.body
        console.log(`[Auth Controller] Register attempt for username: ${username}, email: ${email}`)

        const existingUser = await User.findOne({
            $or: [{ username }, { email }],
        })

        if (existingUser) {
            console.log(`[Auth Controller] Username or email already exists: ${username} / ${email}`)
            return res.render("auth/register", {
                title: "Đăng ký",
                error: "Tên đăng nhập hoặc email đã tồn tại",
            })
        }

        const user = new User({
            username,
            email,
            password,
            fullName,
            role: role || "reader",
        })

        await user.save()
        console.log(`[Auth Controller] User ${username} registered successfully.`)
        res.redirect("/auth/login?success=registered")
    } catch (error) {
        console.error("[Auth Controller] Server error during registration:", error)
        res.render("auth/register", {
            title: "Đăng ký",
            error: "Lỗi server",
        })
    }
}

exports.logout = (req, res) => {
    console.log(`[Auth Controller] User ${req.session.user?.username} logged out.`)
    req.session.destroy()
    res.redirect("/")
}
