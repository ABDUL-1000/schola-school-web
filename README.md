# Schola School Management Dashboard

Schola is a comprehensive web application designed to streamline and centralize school operations. Built with a modern TypeScript React stack, it offers an intuitive and responsive interface for managing students, staff, academic programs, timetables, and administrative settings. This platform aims to enhance efficiency and communication within educational institutions, providing robust tools for a seamless management experience.

## Features

- **Secure Authentication**: Robust user authentication system supporting registration, login, OTP verification, and password reset functionalities.
- **Multi-Branch Management**: Tools to add, edit, and oversee multiple school branches, including the ability to designate a headquarters.
- **Staff and Teacher Administration**: Comprehensive modules for managing staff and teachers, including creating profiles, assigning roles (e.g., ADMIN, TEACHER), and tracking their status.
- **Student Lifecycle Management**: Features for student enrolment, class assignments, reassigning students to different classes, and maintaining student records.
- **Dynamic Class Organization**: Create and manage classes, define academic levels, and assign dedicated class teachers.
- **Subject and Curriculum Control**: Add and edit subjects, and efficiently assign teachers to specific subjects across different classes and days.
- **Interactive Timetable Scheduling**: A flexible system for defining daily periods and constructing detailed class timetables, allowing for easy assignment and modification of subjects and teachers.
- **Performance Tracking**: Dedicated sections for managing exams, assignments, recording results/gradebooks, and generating academic reports.
- **Attendance Monitoring**: Track and manage both student and staff attendance records.
- **School Profile Configuration**: Update core school information such as name, contact details, address, and upload a school logo.
- **Account Security Settings**: Enable users to change their password and manage other security-related preferences.
- **Responsive User Interface**: Optimized layout and functionality across various devices, from desktops to mobile phones.
- **Theme Customization**: Toggle between light and dark modes for a personalized viewing experience.

## Getting Started

### Environment Variables

To run this project, you will need to set up the following environment variable:

- `VITE_API_URL`: The base URL for the backend API (e.g., `http://localhost:8000/api/v1`).

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/schola-school-web.git
    cd schola-school-web
    ```
2.  **Install dependencies** using Bun:
    ```bash
    bun install
    ```
    If you don't have Bun, you can install it via npm or yarn:
    ```bash
    npm install -g bun
    # or
    yarn global add bun
    ```
3.  **Create a `.env` file** in the root directory of the project based on the required environment variables.

### Usage

**Development Mode**:
To run the application in development mode, which includes hot-reloading and development tools:

```bash
bun run dev
```

The application will typically be accessible at `http://localhost:3001`.

**Building for Production**:
To build the application for production, generating optimized and minified assets:

```bash
bun run build
```

The compiled output will be placed in the `dist/` directory. You can then serve these static files using any web server.

**Code Quality Checks**:
Run ESLint to check for code quality issues:

```bash
bun run lint
```

Format your code using Prettier:

```bash
bun run format
```

Run both linting and formatting with automatic fixes:

```bash
bun run check
```

## Technologies Used

| Technology                       | Description                                                                                                            |
| :------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **React 19**                     | A declarative, component-based JavaScript library for building user interfaces.                                        |
| **TypeScript 5**                 | A strongly typed superset of JavaScript that compiles to plain JavaScript, enhancing code quality and maintainability. |
| **Vite 7**                       | A fast build tool that provides a lightning-fast development experience for modern web projects.                       |
| **TanStack Router**              | A fully type-safe router for React, enabling robust and scalable routing solutions.                                    |
| **TanStack Query 5**             | Powerful asynchronous state management for React, simplifying data fetching, caching, and synchronization.             |
| **Tailwind CSS 4**               | A utility-first CSS framework for rapidly building custom designs without leaving your HTML.                           |
| **Shadcn UI**                    | A collection of beautiful, re-usable React components built with Radix UI and Tailwind CSS.                            |
| **Zustand**                      | A small, fast, and scalable bear-necessities state management solution for React.                                      |
| **Axios**                        | A promise-based HTTP client for making API requests.                                                                   |
| **Lucide React**                 | A customizable and tree-shakable icon library for React projects.                                                      |
| **Sonner**                       | An opinionated toast component for React.                                                                              |
| **Vaul**                         | A drawer component for React.                                                                                          |
| **Radix UI**                     | Low-level UI primitives for building accessible design systems.                                                        |
| **Unpic React**                  | Fast, responsive, and high-quality image component for React.                                                          |
| **country-state-city**           | Library for country, state, and city data.                                                                             |
| **naija-state-local-government** | Specific data for Nigerian states and local governments.                                                               |

## Author Info

**[Your Name Here]**

- LinkedIn: `[Your-LinkedIn-Profile]`
- X (Twitter): `[Your-X-Profile]`

## Badges

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TanStack Router](https://img.shields.io/badge/TanStack%20Router-FF4785?style=flat-square&logo=reactrouter&logoColor=white)](https://tanstack.com/router)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-FF4785?style=flat-square&logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Shadcn UI](https://img.shields.io/badge/shadcn/%20UI-000000?style=flat-square&logo=shadcn%20ui&logoColor=white)](https://ui.shadcn.com/)
[![Zustand](https://img.shields.io/badge/Zustand-F9C300?style=flat-square&logo=zustand&logoColor=white)](https://zustand-demo.pmnd.rs/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=flat-square&logo=bun&logoColor=white)](https://bun.sh/)
[![Prettier](https://img.shields.io/badge/prettier-1A2C34?style=flat-square&logo=prettier&logoColor=F7BA3E)](https://prettier.io/)
[![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white)](https://eslint.org/)
[![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)](https://github.com/your-username/schola-school-web)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)
