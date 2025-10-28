from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.websockets import WebSocket
app = FastAPI()

templates = Jinja2Templates(directory="templates")

@app.get('/')
async def root(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    pass