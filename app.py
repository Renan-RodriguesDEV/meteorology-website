import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from routes.after_day import router as after_day_router
from routes.means import router as means_router
from routes.reading import router as reading_router
from routes.sun import router as sun_router

app = FastAPI(
    title="IOT Meteorology API and Dashboard",
    description="API for accessing meteorological data and insights",
    version="1.0.0",
)

templates = Jinja2Templates(directory="templates")

app.mount("/static", StaticFiles(directory="static"), name="static")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(reading_router, prefix="/api")
app.include_router(means_router, prefix="/api")
app.include_router(sun_router, prefix="/api")
app.include_router(after_day_router, prefix="/api")


@app.get("/", response_class=HTMLResponse)
def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/team", response_class=HTMLResponse)
def read_team(request: Request):
    return templates.TemplateResponse("team.html", {"request": request})


@app.get("/mean", response_class=HTMLResponse)
def read_mean(request: Request):
    return templates.TemplateResponse("mean.html", {"request": request})


@app.get("/sun", response_class=HTMLResponse)
def read_sun(request: Request):
    return templates.TemplateResponse("info_sun.html", {"request": request})


@app.get("/after-day", response_class=HTMLResponse)
def read_after_day(request: Request):
    return templates.TemplateResponse("after_day.html", {"request": request})


@app.get("/download", response_class=HTMLResponse)
def read_download(request: Request):
    return templates.TemplateResponse("download.html", {"request": request})


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
