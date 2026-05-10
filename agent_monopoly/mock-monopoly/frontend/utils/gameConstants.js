// 游戏常量定义

// 棋盘配置
export const BOARD_CONFIG = {
  TOTAL_POSITIONS: 40,
  START_POSITION: 0,
  PASS_GO_REWARD: 200,
  JAIL_POSITION: 10,
  GO_TO_JAIL_POSITION: 30,
};

// 玩家配置
export const PLAYER_CONFIG = {
  STARTING_MONEY: 1500,
  MAX_PLAYERS: 6,
  MIN_PLAYERS: 2,
  COLORS: [
    '#FF0000', // 红色
    '#00FF00', // 绿色
    '#0000FF', // 蓝色
    '#FFFF00', // 黄色
    '#FF00FF', // 紫色
    '#00FFFF', // 青色
  ],
};

// 地产类型
export const PROPERTY_TYPES = {
  NORMAL: 'normal',
  RAILROAD: 'railroad',
  UTILITY: 'utility',
};

// 地产颜色分组
export const PROPERTY_COLOR_GROUPS = {
  PURPLE: 'purple',
  LIGHT_BLUE: 'light_blue',
  PINK: 'pink',
  ORANGE: 'orange',
  RED: 'red',
  YELLOW: 'yellow',
  GREEN: 'green',
  DARK_BLUE: 'dark_blue',
  RAILROAD: 'railroad',
  UTILITY: 'utility',
};

// 房屋配置
export const HOUSE_CONFIG = {
  MAX_HOUSES: 4,
  HOUSE_PRICES: {
    purple: 50,
    light_blue: 50,
    pink: 100,
    orange: 100,
    red: 150,
    yellow: 150,
    green: 200,
    dark_blue: 200,
    railroad: 100,
    utility: 100,
  },
};

// 游戏状态
export const GAME_STATES = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
  PAUSED: 'paused',
};

// 玩家状态
export const PLAYER_STATES = {
  READY: 'ready',
  NOT_READY: 'not_ready',
  IN_JAIL: 'in_jail',
  BANKRUPT: 'bankrupt',
};

// 卡牌类型
export const CARD_TYPES = {
  CHANCE: 'chance',
  COMMUNITY: 'community',
};

// 租金倍数（铁路和公共事业）
export const RENT_MULTIPLIERS = {
  RAILROAD_SINGLE: 25,
  RAILROAD_DOUBLE: 50,
  RAILROAD_TRIPLE: 100,
  RAILROAD_QUADRUPLE: 200,
  UTILITY_SINGLE: 4,
  UTILITY_DOUBLE: 10,
};

// 特殊位置
export const SPECIAL_POSITIONS = {
  GO: 0,
  JAIL: 10,
  FREE_PARKING: 20,
  GO_TO_JAIL: 30,
  INCOME_TAX: 4,
  LUXURY_TAX: 38,
};

// 游戏事件类型
export const GAME_EVENTS = {
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  GAME_STARTED: 'game_started',
  DICE_ROLLED: 'dice_rolled',
  PLAYER_MOVED: 'player_moved',
  PROPERTY_BOUGHT: 'property_bought',
  RENT_PAID: 'rent_paid',
  HOUSE_BUILT: 'house_built',
  CARD_DRAWN: 'card_drawn',
  PLAYER_BANKRUPT: 'player_bankrupt',
  GAME_ENDED: 'game_ended',
};

// 错误代码
export const ERROR_CODES = {
  INVALID_ROOM: 'INVALID_ROOM',
  ROOM_FULL: 'ROOM_FULL',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  PROPERTY_NOT_AVAILABLE: 'PROPERTY_NOT_AVAILABLE',
  NOT_YOUR_TURN: 'NOT_YOUR_TURN',
  ALREADY_IN_ROOM: 'ALREADY_IN_ROOM',
};

// API 端点
export const API_ENDPOINTS = {
  USERS: {
    REGISTER: '/api/users/register',
    LOGIN: '/api/users/login',
    GET_ME: '/api/users/me',
  },
  ROOMS: {
    LIST: '/api/rooms',
    CREATE: '/api/rooms/create',
    JOIN: '/api/rooms/join',
    LEAVE: '/api/rooms/leave',
    GET: '/api/rooms/:id',
  },
  PLAYERS: {
    GET: '/api/players/:id',
    UPDATE: '/api/players/:id',
    GET_BY_ROOM: '/api/players/room/:roomId',
  },
  PROPERTIES: {
    LIST: '/api/properties',
    GET: '/api/properties/:id',
  },
  CARDS: {
    DRAW: '/api/cards/draw',
  },
};

// Socket 事件
export const SOCKET_EVENTS = {
  // 客户端到服务器
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
  DRAW_CARD: 'draw_card',
  
  // 服务器到客户端
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  GAME_STARTED: 'game_started',
  DICE_ROLLED: 'dice_rolled',
  PLAYER_MOVED: 'player_moved',
  PROPERTY_BOUGHT: 'property_bought',
  RENT_PAID: 'rent_paid',
  HOUSE_BUILT: 'house_built',
  CARD_DRAWN: 'card_drawn',
  PLAYER_BANKRUPT: 'player_bankrupt',
  GAME_ENDED: 'game_ended',
  ERROR: 'error',
  ROOM_UPDATED: 'room_updated',
};