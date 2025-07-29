const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

// Import models
const User = require("../models/User")
const Book = require("../models/Book")
const BorrowRequest = require("../models/BorrowRequest")
const BookRequest = require("../models/BookRequest")

// Connect to database
mongoose.connect("mongodb://localhost:27017/library-management", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

async function seedDatabase() {
    try {
        console.log("🌱 Starting database seeding...")

        // Clear existing data
        await User.deleteMany({})
        await Book.deleteMany({})
        await BorrowRequest.deleteMany({})
        await BookRequest.deleteMany({})

        console.log("🗑️  Cleared existing data")

        // Create users
        const usersData = [
            // Đổi tên biến để tránh nhầm lẫn
            {
                username: "admin",
                email: "admin@library.com",
                password: "admin123",
                fullName: "Quản trị viên",
                role: "admin",
            },
            {
                username: "librarian",
                email: "librarian@library.com",
                password: "librarian123",
                fullName: "Nguyễn Thị Thủ Thư",
                role: "librarian",
            },
            {
                username: "student1",
                email: "student1@university.edu",
                password: "student123",
                fullName: "Trần Văn Sinh Viên",
                role: "student",
            },
            {
                username: "teacher1",
                email: "teacher1@university.edu",
                password: "teacher123",
                fullName: "Lê Thị Giảng Viên",
                role: "teacher",
            },
            {
                username: "reader1",
                email: "reader1@gmail.com",
                password: "reader123",
                fullName: "Phạm Văn Độc Giả",
                role: "reader",
            },
        ]

        const createdUsers = []
        for (const userData of usersData) {
            const user = new User(userData)
            await user.save() // Lưu từng người dùng để kích hoạt pre('save') hook
            createdUsers.push(user)
        }
        console.log("👥 Created users:", createdUsers.length)

        // --- BẮT ĐẦU ĐOẠN CODE KIỂM TRA MẬT KHẨU ---
        console.log("\n🔍 Performing password verification test...")
        const adminUser = await User.findOne({ username: "admin" })
        if (adminUser) {
            console.log(`[Seed] Admin user found. Hashed password: ${adminUser.password.substring(0, 20)}...`)
            const isPasswordCorrect = await adminUser.comparePassword("admin123")
            console.log(`[Seed] Is 'admin123' correct for admin? ${isPasswordCorrect ? "✅ YES" : "❌ NO"}`)
            if (!isPasswordCorrect) {
                console.error("🚨 Lỗi: Mật khẩu admin không khớp sau khi seed. Có thể có vấn đề với bcryptjs hoặc User model.")
            }
        } else {
            console.error("🚨 Lỗi: Không tìm thấy người dùng admin sau khi seed.")
        }
        console.log("--- KẾT THÚC ĐOẠN CODE KIỂM TRA MẬT KHẨU ---\n")
        // --- KẾT THÚC ĐOẠN CODE KIỂM TRA MẬT KHẨU ---

        // Create books (giữ nguyên phần này)
        const books = [
            {
                bookId: "VH001",
                title: "Truyện Kiều",
                author: "Nguyễn Du",
                year: 1820,
                genre: "Văn học cổ điển",
                summary: "Tác phẩm văn học kinh điển của Việt Nam, kể về cuộc đời đầy gian truân của Thúy Kiều.",
                branches: { A: 5, B: 3, C: 4, D: 2 },
                image: "/placeholder.svg?height=300&width=200",
            },
            {
                bookId: "KH001",
                title: "Vật Lý Đại Cương",
                author: "Nguyễn Văn Khoa",
                year: 2020,
                genre: "Khoa học",
                summary: "Giáo trình vật lý đại cương dành cho sinh viên các ngành kỹ thuật.",
                branches: { A: 10, B: 8, C: 6, D: 4 },
                image: "/placeholder.svg?height=300&width=200",
            },
            {
                bookId: "LS001",
                title: "Lịch Sử Việt Nam",
                author: "Trần Quốc Vượng",
                year: 2018,
                genre: "Lịch sử",
                summary: "Tổng quan về lịch sử Việt Nam từ thời nguyên thủy đến hiện đại.",
                branches: { A: 7, B: 5, C: 8, D: 3 },
                image: "/placeholder.svg?height=300&width=200",
            },
            {
                bookId: "CN001",
                title: "Lập Trình JavaScript",
                author: "Lê Minh Hoàng",
                year: 2021,
                genre: "Công nghệ",
                summary: "Hướng dẫn lập trình JavaScript từ cơ bản đến nâng cao.",
                branches: { A: 6, B: 4, C: 5, D: 7 },
                image: "/placeholder.svg?height=300&width=200",
            },
            {
                bookId: "VH002",
                title: "Số Đỏ",
                author: "Vũ Trọng Phụng",
                year: 1936,
                genre: "Văn học hiện đại",
                summary: "Tiểu thuyết phê phán xã hội về tệ nạn quan liêu thời thuộc địa.",
                branches: { A: 4, B: 6, C: 3, D: 5 },
                image: "/placeholder.svg?height=300&width=200",
            },
            {
                bookId: "KT001",
                title: "Kinh Tế Học Vi Mô",
                author: "Nguyễn Thị Lan",
                year: 2019,
                genre: "Kinh tế",
                summary: "Giáo trình kinh tế học vi mô dành cho sinh viên kinh tế.",
                branches: { A: 8, B: 7, C: 6, D: 5 },
                image: "/placeholder.svg?height=300&width=200",
            },
            {
                bookId: "TT001",
                title: "Tâm Lý Học Đại Cương",
                author: "Phạm Minh Hạc",
                year: 2017,
                genre: "Tâm lý học",
                summary: "Giới thiệu các khái niệm cơ bản về tâm lý học.",
                branches: { A: 5, B: 4, C: 7, D: 6 },
                image: "/placeholder.svg?height=300&width=200",
            },
            {
                bookId: "NN001",
                title: "English Grammar in Use",
                author: "Raymond Murphy",
                year: 2019,
                genre: "Ngoại ngữ",
                summary: "Sách học ngữ pháp tiếng Anh phổ biến nhất thế giới.",
                branches: { A: 12, B: 10, C: 8, D: 6 },
                image: "/placeholder.svg?height=300&width=200",
            },
            {
                bookId: "TH001",
                title: "Toán Cao Cấp",
                author: "Đỗ Công Khanh",
                year: 2020,
                genre: "Toán học",
                summary: "Giáo trình toán cao cấp cho sinh viên kỹ thuật.",
                branches: { A: 9, B: 7, C: 8, D: 5 },
                image: "/placeholder.svg?height=300&width=200",
            },
            {
                bookId: "SK001",
                title: "Tư Duy Nhanh và Chậm",
                author: "Daniel Kahneman",
                year: 2011,
                genre: "Tâm lý học",
                summary: "Khám phá cách thức hoạt động của tư duy con người.",
                branches: { A: 6, B: 8, C: 4, D: 7 },
                image: "/placeholder.svg?height=300&width=200",
            },
        ]

        const createdBooks = await Book.insertMany(books)
        console.log("📚 Created books:", createdBooks.length)

        // Add some comments to books
        const bookWithComments = createdBooks[0] // Truyện Kiều
        bookWithComments.comments.push(
            {
                userId: createdUsers[2]._id,
                username: createdUsers[2].fullName,
                comment: "Tác phẩm kinh điển của văn học Việt Nam, rất hay!",
                rating: 5,
            },
            {
                userId: createdUsers[4]._id,
                username: createdUsers[4].fullName,
                comment: "Câu chuyện cảm động, văn chương tuyệt vời.",
                rating: 5,
            },
        )
        await bookWithComments.save()

        // Create some borrow requests
        const borrowRequests = [
            {
                userId: createdUsers[2]._id, // student1
                bookId: createdBooks[1]._id, // Vật Lý Đại Cương
                fullName: createdUsers[2].fullName,
                bookCode: createdBooks[1].bookId,
                bookTitle: createdBooks[1].title,
                branch: "A",
                pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
                status: "pending",
            },
            {
                userId: createdUsers[3]._id, // teacher1
                bookId: createdBooks[2]._id, // Lịch Sử Việt Nam
                fullName: createdUsers[3].fullName,
                bookCode: createdBooks[2].bookId,
                bookTitle: createdBooks[2].title,
                branch: "B",
                pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // day after tomorrow
                status: "approved",
            },
        ]

        const createdBorrowRequests = await BorrowRequest.insertMany(borrowRequests)
        console.log("📋 Created borrow requests:", createdBorrowRequests.length)

        // Create some book requests
        const bookRequests = [
            {
                userId: createdUsers[2]._id,
                username: createdUsers[2].fullName,
                title: "Clean Code",
                author: "Robert C. Martin",
                year: 2008,
                genre: "Công nghệ",
                summary: "Hướng dẫn viết code sạch và dễ bảo trì.",
                reason: "Cần cho việc học lập trình và phát triển phần mềm.",
                status: "pending",
            },
            {
                userId: createdUsers[4]._id,
                username: createdUsers[4].fullName,
                title: "Sapiens",
                author: "Yuval Noah Harari",
                year: 2011,
                genre: "Lịch sử",
                summary: "Lịch sử ngắn gọn về loài người.",
                reason: "Muốn tìm hiểu về lịch sử và tiến hóa của loài người.",
                status: "pending",
            },
        ]

        const createdBookRequests = await BookRequest.insertMany(bookRequests)
        console.log("📝 Created book requests:", createdBookRequests.length)

        console.log("✅ Database seeding completed successfully!")
        console.log("\n📋 Summary:")
        console.log(`👥 Users: ${createdUsers.length}`)
        console.log(`📚 Books: ${createdBooks.length}`)
        console.log(`📋 Borrow Requests: ${createdBorrowRequests.length}`)
        console.log(`📝 Book Requests: ${createdBookRequests.length}`)

        console.log("\n🔑 Login credentials:")
        console.log("Admin: admin / admin123")
        console.log("Librarian: librarian / librarian123")
        console.log("Student: student1 / student123")
        console.log("Teacher: teacher1 / teacher123")
        console.log("Reader: reader1 / reader123")
    } catch (error) {
        console.error("❌ Error seeding database:", error)
    } finally {
        mongoose.connection.close()
    }
}

// Run the seeding function
seedDatabase()
