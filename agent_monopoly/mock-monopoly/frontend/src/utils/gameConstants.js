// 游戏常量定义

// 棋盘配置
export const BOARD_SIZE = 40; // 棋盘格子总数
export const START_POSITION = 0; // 起点位置
export const PASS_GO_REWARD = 200; // 过起点奖励金额

// 玩家初始配置
export const INITIAL_MONEY = 1500; // 玩家初始资金
export const INITIAL_POSITION = 0; // 玩家初始位置
export const JAIL_POSITION = 10; // 监狱位置
export const MAX_HOUSES_PER_PROPERTY = 4; // 每个地产最多房屋数

// 游戏状态
export const GAME_STATES = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished'
};

// 玩家状态
export const PLAYER_STATES = {
  READY: 'ready',
  NOT_READY: 'not_ready',
  BANKRUPT: 'bankrupt',
  IN_JAIL: 'in_jail'
};

// 地产颜色组
export const PROPERTY_COLORS = {
  BROWN: '棕色',
  LIGHT_BLUE: '浅蓝',
  PINK: '粉色',
  ORANGE: '橙色',
  RED: '红色',
  YELLOW: '黄色',
  GREEN: '绿色',
  DARK_BLUE: '深蓝'
};

// 地产类型
export const PROPERTY_TYPES = {
  NORMAL: 'normal',
  RAILROAD: 'railroad',
  UTILITY: 'utility'
};

// 卡牌类型
export const CARD_TYPES = {
  CHANCE: 'chance',
  COMMUNITY: 'community'
};

// 游戏事件类型
export const EVENT_TYPES = {
  DICE_ROLLED: 'dice_rolled',
  PLAYER_MOVED: 'player_moved',
  PROPERTY_BOUGHT: 'property_bought',
  RENT_PAID: 'rent_paid',
  CARD_DRAWN: 'card_drawn',
  PLAYER_BANKRUPT: 'player_bankrupt',
  GAME_STARTED: 'game_started',
  GAME_ENDED: 'game_ended'
};

// 骰子结果
export const DICE_VALUES = {
  MIN: 1,
  MAX: 6
};

// 货币单位
export const CURRENCY = '$';

// API 端点
export const API_ENDPOINTS = {
  USERS: {
    REGISTER: '/api/users/register',
    LOGIN: '/api/users/login',
    GET_ME: '/api/users/me'
  },
  ROOMS: {
    CREATE: '/api/rooms/create',
    LIST: '/api/rooms',
    JOIN: '/api/rooms/join',
    LEAVE: '/api/rooms/leave'
  },
  PLAYERS: {
    GET: '/api/players',
    UPDATE: '/api/players',
    READY: '/api/players/ready'
  },
  PROPERTIES: {
    LIST: '/api/properties',
    BUY: '/api/properties/buy',
    BUILD: '/api/properties/build'
  },
  CARDS: {
    DRAW: '/api/cards/draw'
  }
};

// Socket 事件
export const SOCKET_EVENTS = {
  // 客户端 → 服务器
  USER_LOGIN: 'user_login',
  USER_REGISTER: 'user_register',
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PLAYER_READY: 'player_ready',
  START_GAME: 'start_game',
  ROLL_DICE: 'roll_dice',
  BUY_PROPERTY: 'buy_property',
  BUILD_HOUSE: 'build_house',
  END_TURN: 'end_turn',
  
  // 服务器 → 客户端
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  ROOM_UPDATED: 'room_updated',
  GAME_STARTED: 'game_started',
  DICE_ROLLED: 'dice_rolled',
  PLAYER_MOVED: 'player_moved',
  PROPERTY_BOUGHT: 'property_bought',
  RENT_PAID: 'rent_paid',
  CARD_DRAWN: 'card_drawn',
  PLAYER_BANKRUPT: 'player_bankrupt',
  GAME_ENDED: 'game_ended',
  ERROR: 'error'
};

// 错误消息
export const ERROR_MESSAGES = {
  NOT_AUTHENTICATED: '用户未认证',
  ROOM_NOT_FOUND: '房间不存在',
  ROOM_FULL: '房间已满',
  ALREADY_IN_ROOM: '已在房间中',
  NOT_IN_ROOM: '不在房间中',
  INVALID_ACTION: '无效操作',
  INSUFFICIENT_FUNDS: '资金不足',
  PROPERTY_NOT_OWNED: '地产未被拥有',
  MAX_HOUSES_REACHED: '已达到最大房屋数'
};

// 默认配置
export const DEFAULT_CONFIG = {
  ROOM_NAME_MAX_LENGTH: 30,
  ROOM_NAME_MIN_LENGTH: 3,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 6,
  MAX_PLAYERS_PER_ROOM: 6,
  MIN_PLAYERS_TO_START: 2
};