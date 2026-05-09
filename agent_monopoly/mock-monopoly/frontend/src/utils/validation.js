/**
 * 表单验证工具函数
 */

// 验证邮箱格式
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 验证密码强度
export const validatePassword = (password) => {
  // 至少8个字符，包含大小写字母和数字
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};

// 验证用户名
export const validateUsername = (username) => {
  // 3-20个字符，只能包含字母、数字和下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// 验证房间名称
export const validateRoomName = (roomName) => {
  // 3-30个字符，不能包含特殊字符
  const roomNameRegex = /^[a-zA-Z0-9\s]{3,30}$/;
  return roomNameRegex.test(roomName) && roomName.trim().length > 0;
};

// 验证房间密码（可选）
export const validateRoomPassword = (password) => {
  // 如果设置了密码，至少6个字符
  if (!password) return true;
  return password.length >= 6;
};

// 验证骰子投掷结果
export const validateDiceRoll = (dice) => {
  // 骰子结果应该是1-6的数字
  return Array.isArray(dice) && dice.length === 2 && 
         dice.every(d => d >= 1 && d <= 6);
};

// 验证玩家位置
export const validatePlayerPosition = (position) => {
  // 位置应该是0-39之间的数字（标准大富翁棋盘有40个格子）
  return Number.isInteger(position) && position >= 0 && position <= 39;
};

// 验证金钱金额
export const validateAmount = (amount) => {
  // 金额应该是正数
  return Number.isFinite(amount) && amount >= 0;
};

// 验证地产ID
export const validatePropertyId = (propertyId) => {
  // ID应该是正整数
  return Number.isInteger(propertyId) && propertyId > 0;
};

// 验证卡牌ID
export const validateCardId = (cardId) => {
  // ID应该是正整数
  return Number.isInteger(cardId) && cardId > 0;
};

// 验证玩家ID
export const validatePlayerId = (playerId) => {
  // ID应该是正整数
  return Number.isInteger(playerId) && playerId > 0;
};

// 表单验证错误消息
export const validationMessages = {
  email: '请输入有效的邮箱地址',
  password: '密码至少8个字符，必须包含大小写字母和数字',
  username: '用户名3-20个字符，只能包含字母、数字和下划线',
  roomName: '房间名称3-30个字符，不能包含特殊字符',
  roomPassword: '房间密码至少6个字符',
  required: '此字段为必填项',
  min: (min) => `最少需要${min}个字符`,
  max: (max) => `最多允许${max}个字符`,
  number: '请输入有效的数字',
  positive: '请输入正数',
};

// 通用表单验证函数
export const validateForm = (formData, rules) => {
  const errors = {};
  
  for (const field in rules) {
    const value = formData[field];
    const fieldRules = rules[field];
    
    // 检查必填字段
    if (fieldRules.required && (!value || value.toString().trim() === '')) {
      errors[field] = validationMessages.required;
      continue;
    }
    
    // 如果字段为空且不是必填，跳过其他验证
    if (!value || value.toString().trim() === '') {
      continue;
    }
    
    // 执行特定字段的验证规则
    for (const rule of fieldRules) {
      switch (rule.type) {
        case 'email':
          if (!validateEmail(value)) {
            errors[field] = validationMessages.email;
          }
          break;
          
        case 'password':
          if (!validatePassword(value)) {
            errors[field] = validationMessages.password;
          }
          break;
          
        case 'username':
          if (!validateUsername(value)) {
            errors[field] = validationMessages.username;
          }
          break;
          
        case 'roomName':
          if (!validateRoomName(value)) {
            errors[field] = validationMessages.roomName;
          }
          break;
          
        case 'minLength':
          if (value.length < rule.value) {
            errors[field] = validationMessages.min(rule.value);
          }
          break;
          
        case 'maxLength':
          if (value.length > rule.value) {
            errors[field] = validationMessages.max(rule.value);
          }
          break;
          
        case 'number':
          if (!Number.isFinite(Number(value))) {
            errors[field] = validationMessages.number;
          }
          break;
          
        case 'positive':
          if (Number(value) <= 0) {
            errors[field] = validationMessages.positive;
          }
          break;
          
        case 'custom':
          if (rule.validator && !rule.validator(value)) {
            errors[field] = rule.message || '验证失败';
          }
          break;
      }
      
      // 如果已经有错误，跳出当前字段的验证
      if (errors[field]) {
        break;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// 注册表单验证规则
export const registerValidationRules = {
  username: [
    { type: 'required' },
    { type: 'username' },
    { type: 'minLength', value: 3 },
    { type: 'maxLength', value: 20 },
  ],
  email: [
    { type: 'required' },
    { type: 'email' },
  ],
  password: [
    { type: 'required' },
    { type: 'password' },
    { type: 'minLength', value: 8 },
  ],
  confirmPassword: [
    { type: 'required' },
    {
      type: 'custom',
      validator: (value, formData) => value === formData.password,
      message: '两次输入的密码不一致',
    },
  ],
};

// 登录表单验证规则
export const loginValidationRules = {
  username: [
    { type: 'required' },
    { type: 'minLength', value: 3 },
  ],
  password: [
    { type: 'required' },
    { type: 'minLength', value: 6 },
  ],
};

// 创建房间表单验证规则
export const createRoomValidationRules = {
  roomName: [
    { type: 'required' },
    { type: 'roomName' },
    { type: 'minLength', value: 3 },
    { type: 'maxLength', value: 30 },
  ],
  password: [
    { type: 'custom', validator: validateRoomPassword },
  ],
  maxPlayers: [
    { type: 'required' },
    { type: 'number' },
    {
      type: 'custom',
      validator: (value) => value >= 2 && value <= 6,
      message: '玩家数量必须在2-6人之间',
    },
  ],
};