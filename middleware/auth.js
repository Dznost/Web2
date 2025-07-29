const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/auth/login")
  }
  next()
}

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect("/auth/login")
    }

    if (!roles.includes(req.session.user.role)) {
      return res.status(403).render("error", {
        title: "Không có quyền truy cập",
        message: "Bạn không có quyền truy cập trang này",
      })
    }

    next()
  }
}

const checkBanned = async (req, res, next) => {
  if (req.session.user) {
    const User = require("../models/User")
    const user = await User.findById(req.session.user.id)

    if (user && user.isBanned()) {
      req.session.destroy()
      return res.redirect("/auth/login?error=banned")
    }
  }
  next()
}

module.exports = {
  requireAuth,
  requireRole,
  checkBanned,
}
