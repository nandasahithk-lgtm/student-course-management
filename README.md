# Student Course Management System

A web-based Student Course Management System built using **Node.js, Express.js, MongoDB, and Mongoose**. The application helps manage student records, course assignments, and academic performance through a responsive dashboard.

## Features

### Student Management
- Add, view, update, and delete student records.
- Store student ID, name, age, and marks.
- Prevent duplicate student IDs.
- Validate student information.

### Course Management
- Add, view, update, and delete courses.
- Associate courses with existing students.
- Prevent duplicate course IDs.
- Prevent deletion of students who still have associated courses.

### Dashboard and Analytics
- View total students and total courses.
- Calculate average and highest student marks.
- Filter students by minimum marks.
- Sort student records by ID, name, or marks.
- View student and course relationships using MongoDB aggregation and `$lookup`.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Version Control:** Git and GitHub

## Project Structure

```text
student-course-management/
├── public/
│   └── index.html
├── .gitignore
├── package.json
├── package-lock.json
└── server.js
```

## Prerequisites

Make sure you have the following installed:

- Node.js and npm
- MongoDB Community Server
- Git (optional, for cloning the repository)

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/nandasahithk-lgtm/student-course-management.git
cd student-course-management
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start MongoDB

Ensure your local MongoDB server is running.

The application connects to the following local database:

```text
mongodb://127.0.0.1:27017/studentCourseDB
```

### 4. Start the application

```bash
npm start
```

### 5. Open the dashboard

Visit:

http://localhost:3000

## Database Collections

The application uses two MongoDB collections:

- `student_master` — stores student details.
- `course_master` — stores course details and student references.

## Learning Objectives

This project demonstrates:

- REST API development using Express.js.
- CRUD operations with MongoDB and Mongoose.
- Schema validation and unique identifiers.
- Relationships between student and course records.
- MongoDB aggregation pipelines using `$match`, `$sort`, `$project`, `$group`, and `$lookup`.
- Frontend and backend integration.

## Future Enhancements

- User authentication and role-based access.
- Pagination for large datasets.
- Export student records to CSV or PDF.
- Improved error logging and automated tests.

## Author

**Nanda Sahit**

GitHub: [@nandasahithk-lgtm](https://github.com/nandasahithk-lgtm)

---

*Developed as a Student Course Management System project using Node.js, Express.js, MongoDB, and Mongoose.*
