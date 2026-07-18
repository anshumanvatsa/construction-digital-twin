# SafeSite - Construction Digital Twin

![SafeSite Logo](public/logo.png)

## Overview
SafeSite is a real-time construction site safety intelligence platform. By leveraging digital twin simulation, predictive analytics, and smart hazard detection, SafeSite helps site managers monitor workers, track equipment, and prevent accidents before they happen.

## Features
- **Real-Time Digital Twin**: Visualize the entire construction site in a 3D-like digital environment.
- **Worker Tracking & Fatigue Monitoring**: Monitor worker positions and health metrics to ensure safety.
- **Hazard Zones & Alerts**: Define hazardous areas (crane operations, restricted zones) and get instant alerts on zone violations.
- **Simulation Engine**: Run predictive simulations to analyze potential risks and optimize site layouts.
- **Responsive Dashboard**: Built with modern web technologies for a seamless experience on any device.

## Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: FastAPI, Python, PostgreSQL, Redis, SQLAlchemy
- **Deployment**: Docker (Multi-stage build), CloudPilot one-click integration

## Getting Started

### Prerequisites
- Node.js (v20+)
- Python (v3.11+)
- Docker (for full-stack deployment)

### Local Development
1. Clone the repository.
2. `npm install` to install frontend dependencies.
3. `npm run dev` to start the frontend.
4. Open the `backend` folder and run `pip install -r requirements.txt`.
5. Run `uvicorn app.main:app --reload` to start the FastAPI server.

## License
MIT License
