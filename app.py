from datetime import datetime
import json
import uuid
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.websockets import WebSocket, WebSocketDisconnect
from manager import ConnectionManager


app = FastAPI()

manager = ConnectionManager()

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get('/')
async def root(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    client_id = str(uuid.uuid4())[:8]
    await manager.connect(websocket, client_id)

    try:
        while True:
                data = await websocket.receive_text()
                message_data = json.loads(data)

                await manager.broadcast({
                     "type": "message",
                     "client_id": client_id,
                     "username": message_data.get("username", "Anonymous"),
                     "content": message_data["content"],
                     "timestamp": datetime.now().isoformat(),
                     "message_type": message_data.get("message_type", "text")
                })

    except WebSocketDisconnect:
         await manager.disconnect(websocket, client_id)
         




































