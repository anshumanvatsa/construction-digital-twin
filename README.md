# 🚧 Construction Site Digital Twin (IoT Simulation Platform)

A real-time, full-stack IoT simulation platform that models construction site safety, worker movement, and risk analytics using a Digital Twin architecture.

---

## 🧠 Overview

This project simulates a smart construction site where:

- Workers move dynamically across a site map
- Risk levels are computed in real time
- Alerts are generated for unsafe behavior
- Managers can monitor safety analytics live

Built as a software-only IoT system (no physical sensors required).

---

## ⚙️ Features

### 👷 Worker Simulation
- Real-time worker movement using WebSockets
- Position tracking (x, y coordinates)
- Smooth animations and movement trails

### ⚠️ Safety Monitoring
- Hazard zone detection
- Risk scoring engine
- Alert generation (high / medium risk)

### 📊 Analytics Dashboard
- Risk trends over time
- Dangerous zone identification
- Worker safety ranking

### 🗺️ Digital Twin Map
- Interactive site visualization
- Worker movement trails
- Zone overlays (safe / restricted / hazard)

### 🔐 Authentication
- JWT-based login system
- Protected routes
- User session handling

---

## 🏗️ Tech Stack

### Frontend
- React + Vite
- TypeScript
- Tailwind CSS
- Framer Motion
- WebSockets

### Backend
- FastAPI
- SQLAlchemy (Async)
- PostgreSQL
- Redis (Pub/Sub)
- WebSockets

---

## 🔄 Architecture

Frontend (React)  
↓  
FastAPI Backend  
↓  
PostgreSQL (Database)  
Redis (Real-time communication)

---

## 🚀 Local Setup

### 1. Clone Repository
