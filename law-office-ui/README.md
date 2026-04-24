# Law Office UI (Frontend)

A high-performance, RTL-first single-page application (SPA) designed to streamline the operations of modern legal practices. This interface serves as the frontend application for the **Lawyer Case Management System**, fully integrated with an ASP.NET Core backend to manage complex legal workflows including case tracking, hearing schedules, firm finances, and secure document vaults.

## ✨ Core Features

- **👥 Clients (CRM)**: Comprehensive client profile management and engagement history.
- **⚖️ Case Tracking**: Visual lifecycle management for legal cases, including status automation and lawyer assignments.
- **📅 Session Scheduler**: Interactive tracker for court hearings and client meetings with real-time status updates.
- **💰 Finance Ledger**: Intuitive dashboards for generating invoices, recording payments, and monitoring firm-wide collections.
- **📁 Document Management**: Secure file interface for uploading and retrieving case-related evidence with authorized access.

## 🛠️ Tech Stack

- **Framework**: Angular 21 (Zoneless + Signals)
- **UI Components**: PrimeNG 21 (Modern, accessible, and RTL-optimized)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Reactivity**: Angular Signals (Next-gen performance and reactivity)

## 🚀 Key Highlights

- **Arabic-First Design**: Native Right-to-Left (RTL) layout with professional typography and localized legal terminology.
- **High-Performance UI**: Efficient reactivity and data flow using **Angular Signals** and **async/await** patterns.
- **Zoneless Architecture**: Leverages the latest Angular 21 features for a lightweight, high-speed user experience.
- **Deep Module Integration**: Seamless navigation and data synchronization between interconnected modules (Cases → Sessions → Finance → Documents).
- **Feature-Based Structure**: Organized into a clean, modular architecture for maximum maintainability and enterprise scalability.

## 📁 Project Structure

```text
📂 src/app
├── 📂 core      # Singleton services, JWT interceptors, and business logic
├── 📂 features  # Feature-based components (Cases, Finance, Dashboard)
├── 📂 layout    # Global layout components (Sidebar, App Container)
└── 📂 shared    # Reusable UI components and common utilities
```

## ⚙️ Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Launch Application**:
   ```bash
   npm start
   ```

3. **Access**:
   Navigate to [http://localhost:4200](http://localhost:4200) in your browser.

> [!IMPORTANT]
> This frontend requires the **Lawyer Case Management API** (Backend) to be running concurrently on [http://localhost:5137](http://localhost:5137).

## 📌 Status
- **Current State**: Fully functional UI with end-to-end API integration.
- **Stability**: Production-ready code structure and modern development patterns.

---
**Author**: Michael Essam
*Showcasing modern Angular expertise and professional RTL UI/UX design.*
"# law-office-system" 
