# E-Quran Academy LMS 

This document tracks the current architecture, functional features, and remaining tasks for the E-Quran Academy platform, turning it into a production-grade multi-role application.

---

## 🛠️ Tech Stack Architecture
- **Frontend**: React.js + TypeScript (Vite Server explicitly on port 3000)
- **State Management**: Redux Toolkit + Redux Persist (saves user sessions across reloads)
- **Styling**: Tailwind CSS + Lucide Icons + Recharts
- **Backend**: Node.js + Express.js 
- **Database**: MySQL (XAMPP locally)
- **Authentication**: Custom JWT (Access/Refresh strategy) + Google OAuth + Email OTPs

---

## ✅ What Is Working Till Now

### 1. Authentication & Security
- **Email/Password Flow**: Fully functional with BCrypt password hashing.
- **Google OAuth**: Fully functioning. Google logins cleanly route through your backend and safely inject JWT tokens into your frontend, bypassing Chrome iframe restrictions.
- **OTP Verifications**: Nodemailer is connected for Email Verification and Forgot Password flows.
- **Token Persistence**: The application issues both Access Tokens (15m) and Refresh Tokens (7d). If you reload the page, you stay logged in.
- **Route Protection (`ProtectedRoute.tsx`)**: Unauthenticated users are kicked out to the role selection terminal.

### 2. Database Integration
- A massive, relational SQL schema (`equran_academy`) has been established.
- Dynamic data queries exist in the Backend (`dashboard.js`, `adminController.js`, `messageController.js`) grabbing LIVE data rather than generic text.

### 3. Messaging Engine
- You can fetch conversations, fetch particular messages with a partner, and securely store chat history.

### 4. Dashboards Structure
- **Admin, Teacher, Student, and Parent** portals physically exist with highly polished UI components, Sidebar navigation, and Dashboard Headers.

---

## 🚧 What You Need To Complete Yet (The Roadmap)

Based on your production specification, here is EXACTLY what is missing and needs to be built next:

### 1. The Strict Admin Verification Workflow
Right now, users can get into the application slightly too easily. We need to lock this down:
- **`approvalMiddleware`**: A backend blocker that checks `is_approved`. If `0`, it completely blocks backend API requests even if the user has a valid JWT token.
- **Admin Action Panel**: The Admin Dashboard needs explicit UI buttons to "Approve" or "Reject" Teacher registrations.
- **Matching Tool**: Admin alone must have a tool to "Link Parent A to Student B" and "Assign Student B to Teacher C".

### 2. Form Document Uploads (Multer)
When a Teacher registers, your spec requires them to upload formal documents:
- **CNIC / ID Card**
- **Teaching Certificates & Resume**
- **Profile Photo**
*Implementation Requirement*: You need to add a library called `multer` to the backend to securely receive `multipart/form-data` files, output them into a `Backend/uploads` folder, and save their file paths to the database.

### 3. Database Missing Links
- Add a new explicit table: `parent_student_links(parent_id, student_id, relation_type)`.
- Update the `students` table to take `guardian_contact` and `desired_course`.
- Update the `teachers` table to hold the URL pathways to the uploaded CNIC/Resume records.

### 4. Complete Purge of Mock Data
- The backend `dashboard.js` endpoints are currently sending mixed data (some real DB stats, some mock fallbacks).
- The frontend `Dashboard.tsx` uses hardcoded `{ name: 'Tajweed', value: 75 }` inside the `ProgressLineChart` and `ComparisonBarChart`.
*Action*: Strip all hardcoded data. Recharts MUST pull its arrays dynamically from the Redux store or React state populated by your API response.

### 5. Independent Landing Pages
- Right now, your main entry is largely a `/role-selection` system. 
- You need completely separate, beautiful promotional Landing Pages for:
  - `Teacher Landing Page`
  - `Student Landing Page`
  - `Parent Landing Page`
- Each must contain Testimonials, FAQ, Course Benefits, etc., before routing into the specific registration form.

---

## 💡 How To Proceed
To build these final components without "hacking" the framework, we should tackle them one feature at a time:
1. **First:** Complete the File Upload capability in the backend (`multer`) so Teachers can actually submit their paperwork.
2. **Second:** Update the Admin Dashboard to give Admin the power to review those documents and approve them.
3. **Third:** Link the real charts to the newly verified data.
