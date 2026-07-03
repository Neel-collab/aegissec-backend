# AegisSec

AI-Powered Cyber Threat Detection and Compliance Platform.

## Architecture

AegisSec is built using Clean Architecture principles and comprises:
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **Backend**: Python, FastAPI, Motor (Async MongoDB).
- **Database**: MongoDB (Local via Docker / Atlas in Prod).
- **AI/ML**: Python, scikit-learn, HuggingFace transformers, TensorFlow/PyTorch.

## Setup

1. Make sure you have Docker and Docker Compose installed.
2. Run `docker-compose up --build` to start the entire stack locally.
3. Access Frontend at `http://localhost:5173`.
4. Access Backend API Docs at `http://localhost:8000/docs`.

## Development

See individual READMEs in `frontend/`, `backend/`, and `ml_modules/`.
