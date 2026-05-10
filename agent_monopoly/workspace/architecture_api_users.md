# RESTful API 设计 - 用户系统

## [POST] /api/users/register
**描述**: 用户注册功能，创建新用户账号  
**权限**: 无需认证  
**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名，3-20字符 |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码，最少6位 |

**请求示例**:
```json
{
  "username": "player1",
  "email": "player1@example.com",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "code": 201,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "player1",
    "email": "player1@example.com",
    "created_at": 1640995200
  }
}
```

**错误响应**:
```json
{
  "code": 400,
  "message": "用户名已存在",
  "error": "Username already exists"
}
```

---

## [POST] /api/users/login
**描述**: 用户登录功能，验证用户身份并返回JWT token  
**权限**: 无需认证  
**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例**:
```json
{
  "username": "player1",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "player1",
      "email": "player1@example.com"
    }
  }
}
```

**错误响应**:
```json
{
  "code": 401,
  "message": "用户名或密码错误",
  "error": "Invalid username or password"
}
```

---

## [GET] /api/users/profile
**描述**: 获取当前登录用户的信息  
**权限**: 需要JWT认证  
**请求参数**: 无  

**请求头**:
```
Authorization: Bearer <JWT_TOKEN>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "获取用户信息成功",
  "data": {
    "id": 1,
    "username": "player1",
    "email": "player1@example.com",
    "created_at": 1640995200
  }
}
```

**错误响应**:
```json
{
  "code": 401,
  "message": "未授权访问",
  "error": "Unauthorized"
}
```

---

## [PUT] /api/users/profile
**描述**: 更新当前登录用户的信息  
**权限**: 需要JWT认证  
**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| email | string | 否 | 邮箱地址 |
| password | string | 否 | 新密码，最少6位 |

**请求示例**:
```json
{
  "email": "newemail@example.com",
  "password": "newpassword123"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新用户信息成功",
  "data": {
    "id": 1,
    "username": "player1",
    "email": "newemail@example.com",
    "created_at": 1640995200
  }
}
```

**错误响应**:
```json
{
  "code": 400,
  "message": "邮箱已被使用",
  "error": "Email already in use"
}
```

---

## [DELETE] /api/users/profile
**描述**: 删除当前登录用户账号  
**权限**: 需要JWT认证  
**请求参数**: 无  

**请求头**:
```
Authorization: Bearer <JWT_TOKEN>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "删除账号成功"
}
```

**错误响应**:
```json
{
  "code": 400,
  "message": "删除账号失败",
  "error": "Failed to delete account"
}
```