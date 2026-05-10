/**
 * 工具函数集合
 */

/**
 * 格式化日期时间
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的日期时间字符串
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('zh-CN');
};

/**
 * 格式化金钱显示
 * @param {number} amount - 金额
 * @returns {string} 格式化后的金额字符串
 */
export const formatMoney = (amount) => {
  return `$${amount.toLocaleString()}`;
};

/**
 * 计算两点之间的距离（欧几里得距离）
 * @param {number} x1 - 第一个点的x坐标
 * @param {number} y1 - 第一个点的y坐标
 * @param {number} x2 - 第二个点的x坐标
 * @param {number} y2 - 第二个点的y坐标
 * @returns {number} 距离值
 */
export const calculateDistance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * 生成随机颜色
 * @returns {string} 随机颜色值
 */
export const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * 检查玩家是否在监狱
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否在监狱
 */
export const isInJail = (player) => {
  return player && player.inJail === 1;
};

/**
 * 检查玩家是否破产
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否破产
 */
export const isBankrupt = (player) => {
  return player && player.money <= 0;
};

/**
 * 检查玩家是否准备就绪
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否准备就绪
 */
export const isReady = (player) => {
  return player && player.isReady === 1;
};

/**
 * 验证玩家移动是否有效
 * @param {Object} player - 玩家对象
 * @param {number} steps - 移动步数
 * @param {number} boardSize - 棋盘大小
 * @returns {Object} { valid: boolean, newPosition: number }
 */
export const validateMove = (player, steps, boardSize = 40) => {
  if (!player) return { valid: false, newPosition: 0 };
  
  let newPosition = (player.position + steps) % boardSize;
  if (newPosition < 0) newPosition += boardSize;
  
  return { valid: true, newPosition };
};

/**
 * 计算地产租金
 * @param {Object} property - 地产对象
 * @param {number} houseCount - 房屋数量
 * @returns {number} 租金金额
 */
export const calculateRent = (property, houseCount = 0) => {
  if (!property) return 0;
  
  // 简化版租金计算，实际游戏中需要更复杂的逻辑
  const baseRent = property.base_rent || 0;
  const houseMultiplier = Math.pow(2, houseCount);
  return baseRent * houseMultiplier;
};

/**
 * 检查是否有足够的钱购买地产
 * @param {Object} player - 玩家对象
 * @param {Object} property - 地产对象
 * @returns {boolean} 是否有足够资金
 */
export const canAffordProperty = (player, property) => {
  if (!player || !property) return false;
  return player.money >= property.price;
};

/**
 * 检查是否有足够的钱建造房屋
 * @param {Object} player - 玩家对象
 * @param {Object} property - 地产对象
 * @returns {boolean} 是否有足够资金
 */
export const canAffordHouse = (player, property) => {
  if (!player || !property) return false;
  const housePrice = property.house_price || 50; // 默认房屋价格
  return player.money >= housePrice;
};

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * 检查是否是有效的房间ID
 * @param {string} roomId - 房间ID
 * @returns {boolean} 是否有效
 */
export const isValidRoomId = (roomId) => {
  return typeof roomId === 'string' && roomId.length > 0;
};

/**
 * 检查是否是有效的玩家ID
 * @param {string} playerId - 玩家ID
 * @returns {boolean} 是否有效
 */
export const isValidPlayerId = (playerId) => {
  return typeof playerId === 'number' || typeof playerId === 'string';
};

/**
 * 本地存储工具
 */
export const storage = {
  /**
   * 设置本地存储
   * @param {string} key - 键
   * @param {any} value - 值
   */
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage', error);
    }
  },
  
  /**
   * 获取本地存储
   * @param {string} key - 键
   * @param {any} defaultValue - 默认值
   * @returns {any} 存储的值
   */
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return defaultValue;
    }
  },
  
  /**
   * 移除本地存储
   * @param {string} key - 键
   */
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage', error);
    }
  },
  
  /**
   * 清空本地存储
   */
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  }
};

/**
 * 游戏状态检查器
 */
export const gameStateChecker = {
  /**
   * 检查游戏是否可以开始
   * @param {Array} players - 玩家列表
   * @param {number} minPlayers - 最小玩家数
   * @param {number} maxPlayers - 最大玩家数
   * @returns {boolean} 是否可以开始
   */
  canStartGame: (players, minPlayers = 2, maxPlayers = 6) => {
    if (!players || players.length < minPlayers) return false;
    if (players.length > maxPlayers) return false;
    return players.every(player => isReady(player));
  },
  
  /**
   * 检查游戏是否结束
   * @param {Array} players - 玩家列表
   * @returns {boolean} 是否结束
   */
  isGameOver: (players) => {
    if (!players || players.length === 0) return true;
    const activePlayers = players.filter(player => !isBankrupt(player));
    return activePlayers.length <= 1;
  }
};

/**
 * 棋盘位置工具
 */
export const boardPosition = {
  /**
   * 获取位置坐标
   * @param {number} position - 位置索引
   * @param {number} boardSize - 棋盘大小
   * @param {number} cellSize - 格子大小
   * @returns {Object} { x, y }
   */
  getPosition: (position, boardSize = 40, cellSize = 60) => {
    // 简化版的棋盘位置计算
    // 实际实现应根据具体的棋盘布局来计算
    const row = Math.floor(position / 10);
    const col = position % 10;
    
    return {
      x: col * cellSize,
      y: row * cellSize
    };
  }
};