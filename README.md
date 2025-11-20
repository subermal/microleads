# MicroLeads – Micro CRM Leads Tracker (Project 1)

A simple full-stack CRM leads tracker built with **Node.js**, **Express**, and **vanilla JavaScript**.  
Users can create, search, filter, and update lead statuses.  
Deployed on **Render**.

---

## 🚀 Live Deployment
Live URL (Render):  
https://microleads.onrender.com

---

## 📦 Repository
GitHub Repository:  
https://github.com/subermal/microleads

---

## 💡 Features

### Core Features 
- Add new leads (name, email, company, source, notes)
- Search by name or company
- Filter by lead status (New, Contacted, Qualified, Lost, Won)
- Update lead statuses using table actions
- Persistent JSON storage
- Responsive layout for desktop & mobile

### My Touch Improvements
- Better email validation (client + server)
- Additional status: **Won** (successful conversion)
- Created-at timestamp included for each lead
- “Showing X of Y leads” summary text
- Inline error messages (instead of alert pop-ups)
- Basic HTML sanitisation for safer rendering
- Improved mobile responsiveness

---

## 🖥️ Run Locally

### Requirements
Node.js 18+

### Installation (Windows / macOS)
```bash
git clone https://github.com/subermal/microleads
cd microleads
npm install
npm start
