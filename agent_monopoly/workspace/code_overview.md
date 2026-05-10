# 代码实现文档 - 总览

> 项目: 在线大富翁游戏

## 已生成的代码文件

| 模块 | 文件数 | 说明 |
|------|-------|------|
| config | 1 | config模块 |
| database | 1 | database模块 |
| models | 5 | models模块 |
| user_api | 2 | user_api模块 |
| room_api | 2 | room_api模块 |
| player_api | 1 | player_api模块 |
| property_api | 1 | property_api模块 |
| card_api | 1 | card_api模块 |
| game_logic | 1 | game_logic模块 |
| socket | 1 | socket模块 |
| server | 1 | server模块 |
| frontend_config | 4 | frontend_config模块 |
| frontend_hooks | 3 | frontend_hooks模块 |
| frontend_utils | 3 | frontend_utils模块 |
| frontend_layout | 2 | frontend_layout模块 |
| frontend_auth_pages | 2 | frontend_auth_pages模块 |
| frontend_lobby | 1 | frontend_lobby模块 |
| frontend_room | 1 | frontend_room模块 |
| frontend_game | 2 | frontend_game模块 |
| frontend_app | 1 | frontend_app模块 |
| documentation | 1 | documentation模块 |


## 统计

- **总文件数**: 37 个
- **后端文件**: 36 个
- **前端文件**: 0 个

## 详细文件列表


### config
- `backend/package.json`

### database
- `backend/src/db/connection.js`

### models
- `backend/src/models/User.js`
- `backend/src/models/Room.js`
- `backend/src/models/Player.js`
- `backend/src/models/Property.js`
- `backend/src/models/Card.js`

### user_api
- `backend/src/routes/users.js`
- `backend/src/middleware/auth.js`

### room_api
- `backend/src/routes/rooms.js`
- `backend/src/services/roomService.js`

### player_api
- `backend/src/routes/players.js`

### property_api
- `backend/src/routes/properties.js`

### card_api
- `backend/src/routes/cards.js`

### game_logic
- `backend/src/services/gameService.js`

### socket
- `backend/src/socket/handler.js`

### server
- `backend/src/server.js`

### frontend_config
- `frontend/package.json`
- `frontend/index.html`
- `frontend/index.js`
- `frontend/vite.config.js`

### frontend_hooks
- `frontend/src/hooks/useAuth.js`
- `frontend/src/hooks/useSocket.js`
- `frontend/src/hooks/useGame.js`

### frontend_utils
- `frontend/src/utils/apiClient.js`
- `frontend/src/utils/validation.js`
- `frontend/src/utils/helpers.js`

### frontend_layout
- `frontend/src/components/layout/Header.jsx`
- `frontend/src/components/layout/Footer.jsx`

### frontend_auth_pages
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/RegisterPage.jsx`

### frontend_lobby
- `frontend/src/pages/LobbyPage.jsx`

### frontend_room
- `frontend/src/pages/RoomPage.jsx`

### frontend_game
- `frontend/src/pages/GamePage.jsx`
- `frontend/src/pages/GameOverPage.jsx`

### frontend_app
- `frontend/src/App.js`

### documentation
- `code_structure.md`


## 完整代码说明

请查看 code_structure.md 获取详细的代码结构说明。

---

*本文档由 Coding Agent 自动生成*
