import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 自动添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 用户相关API
export const userApi = {
  // 用户注册
  register: (userData) => api.post('/users/register', userData),
  
  // 用户登录
  login: (credentials) => api.post('/users/login', credentials),
  
  // 获取当前用户信息
  getMe: () => api.get('/users/me'),
  
  // 更新用户信息
  updateProfile: (userData) => api.put('/users/me', userData)
};

// 房间相关API
export const roomApi = {
  // 获取房间列表
  getRooms: () => api.get('/rooms'),
  
  // 创建房间
  createRoom: (roomData) => api.post('/rooms/create', roomData),
  
  // 加入房间
  joinRoom: (roomId) => api.post(`/rooms/${roomId}/join`),
  
  // 离开房间
  leaveRoom: (roomId) => api.post(`/rooms/${roomId}/leave`),
  
  // 获取房间详情
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
  
  // 玩家准备/取消准备
  toggleReady: (roomId, isReady) => api.put(`/rooms/${roomId}/ready`, { isReady }),
  
  // 开始游戏
  startGame: (roomId) => api.post(`/rooms/${roomId}/start`)
};

// 玩家相关API
export const playerApi = {
  // 获取玩家信息
  getPlayer: (playerId) => api.get(`/players/${playerId}`),
  
  // 更新玩家信息
  updatePlayer: (playerId, playerData) => api.put(`/players/${playerId}`, playerData),
  
  // 获取房间中的所有玩家
  getPlayersByRoom: (roomId) => api.get(`/players/room/${roomId}`)
};

// 地产相关API
export const propertyApi = {
  // 获取所有地产
  getProperties: (roomId) => api.get(`/properties?room_id=${roomId}`),
  
  // 获取特定地产详情
  getProperty: (propertyId) => api.get(`/properties/${propertyId}`),
  
  // 购买地产
  buyProperty: (roomId, propertyId) => api.post(`/properties/${propertyId}/buy`, { roomId }),
  
  // 建造房屋
  buildHouse: (roomId, propertyId) => api.post(`/properties/${propertyId}/build`, { roomId })
};

// 卡牌相关API
export const cardApi = {
  // 抽取机会卡
  drawChanceCard: (roomId) => api.post('/cards/draw', null, {
    params: { cardType: 'chance', roomId }
  }),
  
  // 抽取命运卡
  drawCommunityCard: (roomId) => api.post('/cards/draw', null, {
    params: { cardType: 'community', roomId }
  })
};

// 游戏事件API
export const gameApi = {
  // 掷骰子
  rollDice: (roomId) => api.post(`/game/${roomId}/roll-dice`),
  
  // 结束回合
  endTurn: (roomId) => api.post(`/game/${roomId}/end-turn`)
};

export default api;