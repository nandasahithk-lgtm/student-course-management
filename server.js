
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ================= DATABASE =================

mongoose.connect("mongodb://127.0.0.1:27017/studentCourseDB")
  .then(() => console.log("MongoDB connected: studentCourseDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ================= STUDENT MODEL =================

const studentSchema = new mongoose.Schema({
  sid: {
    type: Number,
    required: true,
    unique: true,
    validate: {
      validator: Number.isInteger,
      message: "Student ID must be an integer"
    }
  },
  name: { type: String, required: true, trim: true },
  age: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: "Age must be an integer"
    }
  },
  marks: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, { versionKey: false });

studentSchema.index({ sid: 1 }, { unique: true });

const Student = mongoose.model(
  "Student",
  studentSchema,
  "student_master"
);

// ================= COURSE MODEL =================

const courseSchema = new mongoose.Schema({
  cid: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  sid: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: "Student ID must be an integer"
    }
  },
  cname: { type: String, required: true, trim: true }
}, { versionKey: false });

courseSchema.index({ cid: 1 }, { unique: true });

const Course = mongoose.model(
  "Course",
  courseSchema,
  "course_master"
);

// ================= HELPERS =================

function sendError(res, error, fallback) {
  if (error.code === 11000) {
    return res.status(409).json({
      message: "Duplicate ID. This ID already exists."
    });
  }

  if (error.name === "ValidationError" ||
      error.name === "CastError") {
    return res.status(400).json({
      message: error.message
    });
  }

  console.error(fallback, error);
  return res.status(500).json({ message: fallback });
}

function validStudentInput(body) {
  return body &&
    Number.isInteger(Number(body.sid)) &&
    String(body.name || "").trim() !== "" &&
    Number.isInteger(Number(body.age)) &&
    Number(body.age) > 0 &&
    body.marks !== "" &&
    Number.isFinite(Number(body.marks)) &&
    Number(body.marks) >= 0 &&
    Number(body.marks) <= 100;
}

function validCourseInput(body) {
  return body &&
    String(body.cid || "").trim() !== "" &&
    Number.isInteger(Number(body.sid)) &&
    String(body.cname || "").trim() !== "";
}

// ================= FRONTEND =================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================= STUDENT CRUD =================

// CREATE student
app.post("/api/students", async (req, res) => {
  try {
    if (!validStudentInput(req.body)) {
      return res.status(400).json({
        message: "Enter a valid SID, name, age and marks (0–100)."
      });
    }

    const student = await Student.create({
      sid: Number(req.body.sid),
      name: req.body.name,
      age: Number(req.body.age),
      marks: Number(req.body.marks)
    });

    res.status(201).json({
      message: "Student added successfully!",
      student
    });
  } catch (error) {
    sendError(res, error, "Error adding student.");
  }
});

// READ students, with optional minimum marks and sorting
app.get("/api/students", async (req, res) => {
  try {
    const pipeline = [];

    if (req.query.minMarks !== undefined &&
        req.query.minMarks !== "") {
      const minMarks = Number(req.query.minMarks);

      if (!Number.isFinite(minMarks) ||
          minMarks < 0 || minMarks > 100) {
        return res.status(400).json({
          message: "Minimum marks must be between 0 and 100."
        });
      }

      pipeline.push({
        $match: { marks: { $gte: minMarks } }
      });
    }

    const allowedSorts = ["marks", "name", "sid"];
    const sortBy = allowedSorts.includes(req.query.sortBy)
      ? req.query.sortBy
      : "sid";

    const order = req.query.order === "desc" ? -1 : 1;

    pipeline.push({ $sort: { [sortBy]: order } });

    pipeline.push({
      $project: {
        _id: 1,
        sid: 1,
        name: 1,
        age: 1,
        marks: 1
      }
    });

    const students = await Student.aggregate(pipeline);
    res.json(students);
  } catch (error) {
    sendError(res, error, "Error fetching students.");
  }
});

// UPDATE student
app.put("/api/students/:id", async (req, res) => {
  try {
    if (!validStudentInput(req.body)) {
      return res.status(400).json({
        message: "Enter a valid SID, name, age and marks (0–100)."
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        sid: Number(req.body.sid),
        name: req.body.name,
        age: Number(req.body.age),
        marks: Number(req.body.marks)
      },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.json({ message: "Student updated successfully!", student });
  } catch (error) {
    sendError(res, error, "Error updating student.");
  }
});

// DELETE student, only when no courses reference the SID
app.delete("/api/students/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const courseExists = await Course.exists({ sid: student.sid });

    if (courseExists) {
      return res.status(409).json({
        message: "Cannot delete this student because courses reference their SID."
      });
    }

    await student.deleteOne();

    res.json({ message: "Student deleted successfully!" });
  } catch (error) {
    sendError(res, error, "Error deleting student.");
  }
});

// ================= COURSE CRUD =================

// CREATE course
app.post("/api/courses", async (req, res) => {
  try {
    if (!validCourseInput(req.body)) {
      return res.status(400).json({
        message: "Enter a valid course ID, student and course name."
      });
    }

    const sid = Number(req.body.sid);
    const student = await Student.findOne({ sid });

    if (!student) {
      return res.status(400).json({
        message: "The selected student does not exist."
      });
    }

    const course = await Course.create({
      cid: String(req.body.cid).trim(),
      sid,
      cname: req.body.cname
    });

    res.status(201).json({
      message: "Course added successfully!",
      course
    });
  } catch (error) {
    sendError(res, error, "Error adding course.");
  }
});

// READ courses
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await Course.find().sort({ cid: 1 }).lean();
    res.json(courses);
  } catch (error) {
    sendError(res, error, "Error fetching courses.");
  }
});

// UPDATE course
app.put("/api/courses/:id", async (req, res) => {
  try {
    if (!validCourseInput(req.body)) {
      return res.status(400).json({
        message: "Enter a valid course ID, student and course name."
      });
    }

    const sid = Number(req.body.sid);
    const student = await Student.findOne({ sid });

    if (!student) {
      return res.status(400).json({
        message: "The selected student does not exist."
      });
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        cid: String(req.body.cid).trim(),
        sid,
        cname: req.body.cname
      },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    res.json({ message: "Course updated successfully!", course });
  } catch (error) {
    sendError(res, error, "Error updating course.");
  }
});

// DELETE course
app.delete("/api/courses/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    res.json({ message: "Course deleted successfully!" });
  } catch (error) {
    sendError(res, error, "Error deleting course.");
  }
});

// ================= AGGREGATION =================

// Dashboard: $group
app.get("/api/dashboard", async (req, res) => {
  try {
    const [totalStudents, totalCourses, stats] = await Promise.all([
      Student.countDocuments(),
      Course.countDocuments(),
      Student.aggregate([
        {
          $group: {
            _id: null,
            averageMarks: { $avg: "$marks" },
            highestMarks: { $max: "$marks" }
          }
        }
      ])
    ]);

    res.json({
      totalStudents,
      totalCourses,
      averageMarks: stats[0]?.averageMarks ?? 0,
      highestMarks: stats[0]?.highestMarks ?? 0
    });
  } catch (error) {
    sendError(res, error, "Error loading dashboard.");
  }
});

// Student + Course Overview: $lookup
app.get("/api/overview", async (req, res) => {
  try {
    const overview = await Student.aggregate([
      {
        $lookup: {
          from: "course_master",
          localField: "sid",
          foreignField: "sid",
          as: "courses"
        }
      },
      {
        $project: {
          _id: 0,
          sid: 1,
          name: 1,
          age: 1,
          marks: 1,
          courses: {
            $map: {
              input: "$courses",
              as: "course",
              in: {
                cid: "$$course.cid",
                cname: "$$course.cname"
              }
            }
          }
        }
      },
      { $sort: { sid: 1 } }
    ]);

    res.json(overview);
  } catch (error) {
    sendError(res, error, "Error loading overview.");
  }
});

// ================= START SERVER =================

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
