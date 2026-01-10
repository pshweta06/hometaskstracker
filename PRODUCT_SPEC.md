# Product Specification: HomeTasks Tracker

## 1. Objective
A role-based web application to track home cleaning tasks. It features a "smart" scheduling engine that balances workload and handles task rollovers, with distinct interfaces for household members (Users) and managers (Admins).

## 2. Access Control & Roles
*   **Login System:** A landing page requiring a username and password.
*   **User Role:**
    *   View tasks due this week (including "Delayed" tasks).
    *   Mark tasks as completed.
    *   View "Next Week Preview."
*   **Admin Role:**
    *   Full access to the User dashboard.
    *   **Task Manager:** A dedicated UI to add new tasks, edit existing task details (room, frequency), or delete retired tasks.

## 3. Core Logic Features
*   **Smart Rollover:** Unfinished tasks automatically carry over to the next week with a **"Delayed"** tag.
*   **Dynamic Recalculation:** Completion date + Frequency = New Due Date.
*   **Initial Staggering:** New tasks (or the initial CSV import) are automatically distributed across the calendar to prevent "peak" chore weeks.

## 4. Technical Architecture
*   **Frontend:** HTML5, CSS3 (Modern Responsive Design), and Vanilla JavaScript.
*   **Persistence:** `localStorage` will store the Task Master List, Completion History, and User sessions.

---

# Implementation Plan

## Phase 1: Authentication & Routing
1.  **Login Logic:** Create a simple authentication guard.
    *   *Demo Credentials:* `admin/admin123` and `user/user123`.
2.  **View Routing:** Use JavaScript to toggle between `Login`, `User Dashboard`, and `Admin Panel`.

## Phase 2: Data Management (Admin Focus)
1.  **Task CRUD Interface:** 
    *   Table view for all tasks.
    *   "Add Task" form with Room, Task Name, and Frequency (Weekly, Monthly, Quarterly).
2.  **Data Initialization:** Script to import `Home Cleaning Schedule - Tasks.csv` into `localStorage`.

## Phase 3: The Task Engine (User Focus)
1.  **Date & Filter Utility:**
    *   Logic to calculate current week boundaries.
    *   Logic for `getDelayedTasks()` and `getNextDue()`.
2.  **Dynamic Rendering:**
    *   Render "Delayed" section.
    *   Render "This Week" (grouped by room).
    *   Render "Next Week Preview".

## Phase 4: UI/UX & Polish
1.  **Responsive Design:** Mobile-friendly checkbox list.
2.  **Visual Cues:** Progress bar and color-coded tags.

