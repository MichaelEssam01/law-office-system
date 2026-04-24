# Lawyer Case Management System

A professional, full-stack Practice Management System (PMS) designed for legal firms. This application streamlines complex legal workflows—from client intake and case lifecycle tracking to automated financial billing and secure document management—all delivered through a premium, Arabic-first RTL (Right-To-Left) interface.

## ✨ Highlights

- **🎯 Specialized Logic**: Built-in legal business rules, including automated invoice status transitions and overpayment prevention.
- **🔒 Secure File Handling**: Case documents are stored in private storage (outside public web roots) and served via authorized blob streaming.
- **🌍 Arabic-First UI**: Native RTL support with professional localized terminology, ensuring a premium experience for Middle Eastern legal practices.
- **📊 Real-Time Analytics**: Live dashboard featuring PrimeNG charts for case distribution, revenue trends, and upcoming hearing schedules.

## 🚀 Key Modules

- **👥 CRM (Client Management)**: Detailed client profiles with full case and payment history.
- **⚖️ Case Management**: Complete lifecycle tracking from intake to closure, with lawyer assignments and status automation.
- **📅 Session Scheduler**: Interactive court hearing management with location tracking and status updates.
- **💰 Finance Engine**: Automated invoicing for legal fees, payment recording with balance tracking, and financial health reporting.
- **📁 Document Vault**: Secure, categorized storage (Contracts, Evidence, Court Docs) with restricted access and GUID-based file protection.

## 🛠️ Tech Stack

- **Backend**: .NET 8 Web API, Entity Framework Core (SQL Server), ASP.NET Core Identity, JWT.
- **Frontend**: Angular 19+, PrimeNG 21, Tailwind CSS.
- **Architecture**: **Clean Architecture** (Domain-Driven Design principles) ensuring high maintainability and testability.

## 📁 Project Structure

```text
📂 LawOffice
├── 📂 LawOffice.Domain         # Domain Entities, Enums, and Core Models
├── 📂 LawOffice.Application    # DTOs, Service Interfaces, and Use Cases
├── 📂 LawOffice.Infrastructure # Persistence (EF Core), Migrations, and Repositories
├── 📂 LawOffice.API            # RESTful Controllers, Auth, and Configuration
└── 📂 law-office-ui            # Modern Angular SPA (RTL-optimized)
```

## ⚙️ Setup & Installation

### 🖥️ Backend (Web API)
1. Navigate to `/LawOffice.API`.
2. Configure your SQL Server connection string in `appsettings.json`.
3. Apply database migrations:
   ```bash
   dotnet ef database update
   ```
4. Run the API:
   ```bash
   dotnet run
   ```

### 🎨 Frontend (Angular)
1. Navigate to `/law-office-ui`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm start
   ```
4. Open `http://localhost:4200` (Default credentials: `admin@lawoffice.com` / `Admin@123`).

---
**Project Status**: Production-Ready / Portfolio Complete.
*Demonstrating expertise in Full-Stack development, Clean Architecture, and localized UI/UX design.*
