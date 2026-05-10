/**
 * 工具函数集合
 * 用于前端应用的通用功能
 */

/**
 * 格式化时间戳为可读格式
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

/**
 * 格式化货币金额
 * @param {number} amount - 金额
 * @returns {string} 格式化后的货币字符串
 */
export function formatCurrency(amount) {
  return `$${amount.toLocaleString()}`;
}

/**
 * 生成随机颜色
 * @returns {string} 随机颜色值
 */
export function getRandomColor() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 检查是否是有效的邮箱地址
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 检查是否是有效的用户名
 * @param {string} username - 用户名
 * @returns {boolean} 是否有效
 */
export function isValidUsername(username) {
  // 用户名长度3-20，只包含字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * 检查是否是有效的密码
 * @param {string} password - 密码
 * @returns {boolean} 是否有效
 */
export function isValidPassword(password) {
  // 密码至少6位
  return password.length >= 6;
}

/**
 * 本地存储工具类
 */
export const storage = {
  /**
   * 设置本地存储项
   * @param {string} key - 键名
   * @param {any} value - 值
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('设置本地存储失败:', error);
    }
  },

  /**
   * 获取本地存储项
   * @param {string} key - 键名
   * @param {any} defaultValue - 默认值
   * @returns {any} 存储的值
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('获取本地存储失败:', error);
      return defaultValue;
    }
  },

  /**
   * 删除本地存储项
   * @param {string} key - 键名
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('删除本地存储失败:', error);
    }
  },

  /**
   * 清空本地存储
   */
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('清空本地存储失败:', error);
    }
  }
};

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<void>}
 */
export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text).catch(error => {
    console.error('复制到剪贴板失败:', error);
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (error) {
      console.error('降级复制失败:', error);
    }
    document.body.removeChild(textArea);
  });
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }

  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 数组去重
 * @param {Array} array - 要去重的数组
 * @param {string} key - 如果是对象数组，指定去重的键
 * @returns {Array} 去重后的数组
 */
export function uniqueArray(array, key) {
  if (!key) {
    return [...new Set(array)];
  }
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * 计算两个日期之间的天数
 * @param {Date} date1 - 第一个日期
 * @param {Date} date2 - 第二个日期
 * @returns {number} 天数差
 */
export function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffTime = Math.abs(date2 - date1);
  return Math.round(diffTime / oneDay);
}

/**
 * 获取URL参数
 * @param {string} url - URL字符串
 * @returns {Object} 参数对象
 */
export function getUrlParams(url = window.location.href) {
  const params = {};
  const searchParams = new URL(url).searchParams;
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  return params;
}

/**
 * 构建URL查询字符串
 * @param {Object} params - 参数对象
 * @returns {string} 查询字符串
 */
export function buildQueryString(params) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      searchParams.append(key, value);
    }
  }
  return searchParams.toString();
}

/**
 * 检查对象是否为空
 * @param {Object} obj - 要检查的对象
 * @returns {boolean} 是否为空
 */
export function isEmptyObject(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

/**
 * 检查数组是否为空
 * @param {Array} array - 要检查的数组
 * @returns {boolean} 是否为空
 */
export function isEmptyArray(array) {
  return !array || array.length === 0;
}

/**
 * 安全的对象属性访问
 * @param {Object} obj - 对象
 * @param {string} path - 属性路径，如 'user.profile.name'
 * @param {any} defaultValue - 默认值
 * @returns {any} 属性值
 */
export function get(obj, path, defaultValue = undefined) {
  const travel = (regexp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : undefined), obj);
  const result = travel(/[.[\]]+/);
  return result === undefined || result === obj ? defaultValue : result;
}

/**
 * 简单的哈希函数
 * @param {string} str - 要哈希的字符串
 * @returns {string} 哈希值
 */
export function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash.toString();
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}