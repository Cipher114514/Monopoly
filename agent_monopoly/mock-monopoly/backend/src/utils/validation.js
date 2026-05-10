/**
 * 验证工具模块
 * 提供各种数据验证功能
 */

/**
 * 验证用户名格式
 * @param {string} username - 用户名
 * @returns {boolean} - 是否有效
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') return false;
  // 用户名长度3-20，只允许字母、数字、下划线
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} - 是否有效
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // 基本邮箱格式验证
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @returns {boolean} - 是否有效
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  // 密码至少6位
  return password.length >= 6;
}

/**
 * 验证房间名称
 * @param {string} name - 房间名称
 * @returns {boolean} - 是否有效
 */
function validateRoomName(name) {
  if (!name || typeof name !== 'string') return false;
  // 房间名称长度1-50，不允许特殊字符
  return name.trim().length > 0 && name.length <= 50;
}

/**
 * 验证最大玩家数
 * @param {number} maxPlayers - 最大玩家数
 * @returns {boolean} - 是否有效
 */
function validateMaxPlayers(maxPlayers) {
  if (typeof maxPlayers !== 'number' || !Number.isInteger(maxPlayers)) return false;
  // 玩家数必须在2-6之间
  return maxPlayers >= 2 && maxPlayers <= 6;
}

/**
 * 验证骰子点数
 * @param {number} diceValue - 骰子点数
 * @returns {boolean} - 是否有效
 */
function validateDiceValue(diceValue) {
  if (typeof diceValue !== 'number' || !Number.isInteger(diceValue)) return false;
  // 骰子点数必须在1-6之间
  return diceValue >= 1 && diceValue <= 6;
}

/**
 * 验证玩家位置
 * @param {number} position - 玩家位置
 * @returns {boolean} - 是否有效
 */
function validatePlayerPosition(position) {
  if (typeof position !== 'number' || !Number.isInteger(position)) return false;
  // 位置必须在0-39之间（标准大富翁棋盘40格）
  return position >= 0 && position <= 39;
}

/**
 * 验证金钱数量
 * @param {number} money - 金钱数量
 * @returns {boolean} - 是否有效
 */
function validateMoney(money) {
  if (typeof money !== 'number' || !Number.isInteger(money)) return false;
  // 金钱必须是非负数
  return money >= 0;
}

/**
 * 验证地产ID
 * @param {number} propertyId - 地产ID
 * @returns {boolean} - 是否有效
 */
function validatePropertyId(propertyId) {
  if (typeof propertyId !== 'number' || !Number.isInteger(propertyId)) return false;
  // 地产ID必须大于0
  return propertyId > 0;
}

/**
 * 验证卡牌类型
 * @param {string} cardType - 卡牌类型
 * @returns {boolean} - 是否有效
 */
function validateCardType(cardType) {
  if (!cardType || typeof cardType !== 'string') return false;
  // 只允许 'chance' 或 'community'
  return cardType === 'chance' || cardType === 'community';
}

/**
 * 验证房间ID
 * @param {number} roomId - 房间ID
 * @returns {boolean} - 是否有效
 */
function validateRoomId(roomId) {
  if (typeof roomId !== 'number' || !Number.isInteger(roomId)) return false;
  // 房间ID必须大于0
  return roomId > 0;
}

/**
 * 验证用户ID
 * @param {number} userId - 用户ID
 * @returns {boolean} - 是否有效
 */
function validateUserId(userId) {
  if (typeof userId !== 'number' || !Number.isInteger(userId)) return false;
  // 用户ID必须大于0
  return userId > 0;
}

/**
 * 验证颜色格式
 * @param {string} color - 颜色值
 * @returns {boolean} - 是否有效
 */
function validateColor(color) {
  if (!color || typeof color !== 'string') return false;
  // 验证十六进制颜色格式
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * 验证布尔值
 * @param {*} value - 待验证值
 * @returns {boolean} - 是否有效布尔值
 */
function validateBoolean(value) {
  return typeof value === 'boolean';
}

/**
 * 综合验证用户注册数据
 * @param {object} userData - 用户数据
 * @returns {object} - 验证结果 { valid: boolean, errors: string[] }
 */
function validateUserRegistration(userData) {
  const errors = [];
  
  if (!validateUsername(userData.username)) {
    errors.push('用户名必须是3-20位的字母、数字或下划线');
  }
  
  if (!validateEmail(userData.email)) {
    errors.push('邮箱格式不正确');
  }
  
  if (!validatePassword(userData.password)) {
    errors.push('密码至少需要6位');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 综合验证创建房间数据
 * @param {object} roomData - 房间数据
 * @returns {object} - 验证结果 { valid: boolean, errors: string[] }
 */
function validateCreateRoom(roomData) {
  const errors = [];
  
  if (!validateRoomName(roomData.name)) {
    errors.push('房间名称不能为空且长度不超过50个字符');
  }
  
  if (!validateMaxPlayers(roomData.maxPlayers)) {
    errors.push('最大玩家数必须在2-6之间');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 综合验证购买地产数据
 * @param {object} data - 购买数据
 * @returns {object} - 验证结果 { valid: boolean, errors: string[] }
 */
function validateBuyProperty(data) {
  const errors = [];
  
  if (!validateRoomId(data.roomId)) {
    errors.push('无效的房间ID');
  }
  
  if (!validatePropertyId(data.propertyId)) {
    errors.push('无效的地产ID');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 综合验证掷骰子数据
 * @param {object} data - 掷骰子数据
 * @returns {object} - 验证结果 { valid: boolean, errors: string[] }
 */
function validateRollDice(data) {
  const errors = [];
  
  if (!validateRoomId(data.roomId)) {
    errors.push('无效的房间ID');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  // 基础验证函数
  validateUsername,
  validateEmail,
  validatePassword,
  validateRoomName,
  validateMaxPlayers,
  validateDiceValue,
  validatePlayerPosition,
  validateMoney,
  validatePropertyId,
  validateCardType,
  validateRoomId,
  validateUserId,
  validateColor,
  validateBoolean,
  
  // 综合验证函数
  validateUserRegistration,
  validateCreateRoom,
  validateBuyProperty,
  validateRollDice
};