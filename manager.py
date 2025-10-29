# from fastapi.websockets import WebSocket

# class WebSocketManager:
#     def __init__(self):
#         self.connected_clients = []

#     async def connect(self, websocket:WebSocket):
#         client_ip = f"{websocket.client.host}: {websocket.client.port}"
#         await websocket.accept()
#         print(f"{client_ip}")
#         self.connected_clients.append(websocket)
#         print(f"Connected clients: {self.connected_clients}")

#         message = {
#             "client": client_ip,
#             "message": f"Welcome"
#         }
#         await websocket.send_json(message)


#     async def send_message(self, websocket:WebSocket, message:dict):
#         print(f"message: {message}")
#         message = {
#             "client": f"{websocket.client.host}:{websocket.client.port}",
#             "message": message['content']
#         }
#         await websocket.send_json(message)

#     async def disconnect(self, websocket):
#         self.connected_clients.remove(websocket)
#         print(f"Client {websocket.client.host}: {websocket.client.port} disconnected")
#         print(f"connected clients: {self.connected_clients}")










from fastapi.websockets import WebSocket
from typing import Dict, List
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[Dict] = []

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        client_info = {
            "websocket": websocket,
            "client_id": client_id,
            "username": f"User_{client_id}",
            "joined_at": datetime.now().isoformat()
        }
        self.active_connections.append(client_info)

        await self.broadcast({
            "type": "user_joined",
            "client_id": client_id,
            "username": client_info["username"],
            "timestamp": datetime.now().isoformat(),
            "active_users": len(self.active_connections)
        })

    async def disconnect(self, websocket:WebSocket, client_id:str):
        disconnected_user = None
        for connection in self.active_connections:
            if connection["websocket"] == websocket:
                disconnected_user = connection
                self.active_connections.remove(connection)
                break
        
        if disconnected_user:
            await self.broadcast({
                "type": "user_left",
                "client_id": client_id,
                "username": disconnected_user["username"],
                "timestamp": datetime.now().isoformat(),
                "active_users": len(self.active_connections)    
            })

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection["websocket"].send_json(message)
            except Exception as e:
                print(f"Error sending message to {connection['client_id']}: {e}")

    def active_users_count(self):
        return len(self.active_connections)
    
