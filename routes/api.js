// routes/api.js
const express = require("express");
const router = express.Router();
const Book = require("../models/Book");

router.get("/book/:id", async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ error: "Không tìm thấy sách" });

        const totalBooks =
            (book.branches.A || 0) +
            (book.branches.B || 0) +
            (book.branches.C || 0) +
            (book.branches.D || 0);

        res.json({ totalBooks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server khi lấy sách" });
    }
});

module.exports = router;
