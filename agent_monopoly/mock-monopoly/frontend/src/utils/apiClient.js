import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
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
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // 服务器返回了错误状态码
      switch (error.response.status) {
        case 401:
          // 未授权，清除token并重定向到登录页
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          break;
        case 403:
          // 禁止访问
          console.error('Access forbidden:', error.response.data.message);
          break;
        case 404:
          // 资源不存在
          console.error('Resource not found:', error.response.data.message);
          break;
        case 500:
          // 服务器错误
          console.error('Server error:', error.response.data.message);
          break;
        default:
          console.error('API error:', error.response.data.message);
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('No response received:', error.message);
    } else {
      // 请求设置出错
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

// 用户相关API
export const userAPI = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (userData) => apiClient.put('/auth/profile', userData),
};

// 房间相关API
export const roomAPI = {
  createRoom: (roomData) => apiClient.post('/rooms', roomData),
  getRooms: () => apiClient.get('/rooms'),
  getRoom: (roomId) => apiClient.get(`/rooms/${roomId}`),
  joinRoom: (roomId) => apiClient.post(`/rooms/${roomId}/join`),
  leaveRoom: (roomId) => apiClient.post(`/rooms/${roomId}/leave`),
  startGame: (roomId) => apiClient.post(`/rooms/${roomId}/start`),
  setPlayerReady: (roomId, ready) => apiClient.post(`/rooms/${roomId}/ready`, { ready }),
};

// 游戏相关API
export const gameAPI = {
  getGameState: (roomId) => apiClient.get(`/game/${roomId}/state`),
  rollDice: (roomId) => apiClient.post(`/game/${roomId}/roll-dice`),
  buyProperty: (roomId, propertyId) => apiClient.post(`/game/${roomId}/buy-property`, { propertyId }),
  buildHouse: (roomId, propertyId) => apiClient.post(`/game/${roomId}/build-house`, { propertyId }),
  endTurn: (roomId) => apiClient.post(`/game/${roomId}/end-turn`),
  useCard: (roomId, cardId, targetPlayerId) => 
    apiClient.post(`/game/${roomId}/use-card`, { cardId, targetPlayerId }),
};

// 地产相关API
export const propertyAPI = {
  getProperties: () => apiClient.get('/properties'),
  getProperty: (propertyId) => apiClient.get(`/properties/${propertyId}`),
};

// 卡牌相关API
export const cardAPI = {
  getCards: () => apiClient.get('/cards'),
  getCard: (cardId) => apiClient.get(`/cards/${cardId}`),
};

export default apiClient;