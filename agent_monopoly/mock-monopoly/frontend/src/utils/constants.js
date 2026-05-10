// 游戏常量定义

// 游戏配置
export const GAME_CONFIG = {
  BOARD_SIZE: 40,  // 游戏盘面格子数
  STARTING_MONEY: 1500,  // 初始资金
  GO_PASS_MONEY: 200,  // 过起点奖励
  JAIL_FINE: 50,  // 保释金
  MAX_PLAYERS: 6,  // 最大玩家数
  MIN_PLAYERS: 2,  // 最小玩家数
  HOUSE_PRICE_RATIO: 0.5,  // 房屋价格是地价的倍数
  HOTEL_PRICE_RATIO: 1.0,  // 酒店价格是地价的倍数
};

// 颜色组定义
export const COLOR_GROUPS = {
  BROWN: { name: '棕色', color: '#8B4513' },
  LIGHT_BLUE: { name: '浅蓝', color: '#87CEEB' },
  PINK: { name: '粉色', color: '#FFB6C1' },
  ORANGE: { name: '橙色', color: '#FFA500' },
  RED: { name: '红色', color: '#FF0000' },
  YELLOW: { name: '黄色', color: '#FFFF00' },
  GREEN: { name: '绿色', color: '#008000' },
  BLUE: { name: '深蓝', color: '#0000FF' },
};

// 卡牌类型
export const CARD_TYPES = {
  CHANCE: 'chance',  // 机会卡
  COMMUNITY: 'community',  // 命运卡
};

// 游戏状态
export const GAME_STATES = {
  WAITING: 'waiting',  // 等待玩家
  PLAYING: 'playing',  // 游戏中
  FINISHED: 'finished',  // 已结束
  PAUSED: 'paused',  // 暂停
};

// 玩家状态
export const PLAYER_STATES = {
  READY: 'ready',  // 准备就绪
  NOT_READY: 'not_ready',  // 未准备
  PLAYING: 'playing',  // 正在游戏中
  BANKRUPT: 'bankrupt',  // 破产
  IN_JAIL: 'in_jail',  // 在监狱
};

// 地产类型
export const PROPERTY_TYPES = {
  NORMAL: 'normal',  // 普通地产
  RAILROAD: 'railroad',  // 铁路
   UTILITY: 'utility',  // 公用事业
   SPECIAL: 'special',  // 特殊地产（如起点、监狱等）
};

// 房屋数量限制
export const HOUSE_LIMITS = {
  NORMAL: 4,  // 普通地产最多4个房屋
  RAILROAD: 0,  // 铁路不能建房屋
  UTILITY: 0,  // 公用事业不能建房屋
  SPECIAL: 0,  // 特殊地产不能建房屋
};

// 租金计算类型
export const RENT_TYPES = {
  BASE: 'base',  // 基础租金
  HOUSE: 'house',  // 房屋租金
  HOTEL: 'hotel',  // 酒店租金
  RAILROAD_SINGLE: 'railroad_single',  // 单个铁路租金
  RAILROAD_SET: 'railroad_set',  // 全部铁路租金
  UTILITY_DICE: 'utility_dice',  // 公用事业（骰子点数×倍数）
};

// API 端点
export const API_ENDPOINTS = {
  // 用户相关
  REGISTER: '/api/users/register',
  LOGIN: '/api/users/login',
  LOGOUT: '/api/users/logout',
  GET_ME: '/api/users/me',
  
  // 房间相关
  GET_ROOMS: '/api/rooms',
  CREATE_ROOM: '/api/rooms/create',
  JOIN_ROOM: '/api/rooms/join',
  LEAVE_ROOM: '/api/rooms/leave',
  GET_ROOM: '/api/rooms/:id',
  
  // 玩家相关
  GET_PLAYERS: '/api/players',
  GET_PLAYER: '/api/players/:id',
  
  // 地产相关
  GET_PROPERTIES: '/api/properties',
  BUY_PROPERTY: '/api/properties/buy',
  BUILD_HOUSE: '/api/properties/build',
  
  // 卡牌相关
  DRAW_CARD: '/api/cards/draw',
  
  // 游戏相关
  START_GAME: '/api/game/start',
  END_TURN: '/api/game/end-turn',
  ROLL_DICE: '/api/game/roll-dice',
};

// Socket 事件
export const SOCKET_EVENTS = {
  // 客户端 → 服务端
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PLAYER_READY: 'player_ready',
  START_GAME: 'start_game',
  ROLL_DICE: 'roll_dice',
  BUY_PROPERTY: 'buy_property',
  BUILD_HOUSE: 'build_house',
  END_TURN: 'end_turn',
  
  // 服务端 → 客户端
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  PLAYER_READY: 'player_ready',
  GAME_STARTED: 'game_started',
  DICE_ROLLED: 'dice_rolled',
  PLAYER_MOVED: 'player_moved',
  PROPERTY_BOUGHT: 'property_bought',
  HOUSE_BUILT: 'house_built',
  TURN_ENDED: 'turn_ended',
  GAME_ENDED: 'game_ended',
  ERROR: 'error',
};

// 错误代码
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 500,
  INVALID_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  
  // 用户相关错误
  USER_ALREADY_EXISTS: 1001,
  USER_NOT_FOUND: 1002,
  INVALID_PASSWORD: 1003,
  
  // 房间相关错误
  ROOM_NOT_FOUND: 2001,
  ROOM_FULL: 2002,
  ROOM_ALREADY_STARTED: 2003,
  ROOM_NOT_JOINED: 2004,
  
  // 游戏相关错误
  NOT_YOUR_TURN: 3001,
  INSUFFICIENT_MONEY: 3002,
  PROPERTY_NOT_OWNED: 3003,
  PROPERTY_ALREADY_OWNED: 3004,
  CANNOT_BUILD_HOUSE: 3005,
};

// 成功代码
export const SUCCESS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  ACCEPTED: 202,
};

// 本地存储键名
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'monopoly_auth_token',
  USER_DATA: 'monopoly_user_data',
  ROOM_DATA: 'monopoly_room_data',
};