// 配置文件
const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  },
  
  // 数据库配置
  database: {
    path: process.env.DB_PATH || './database.sqlite'
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // 游戏配置
  game: {
    maxPlayers: 6,
    minPlayers: 2,
    startingMoney: 1500,
    jailFine: 50,
    maxHouses: 4,
    maxHotels: 1
  },
  
  // Socket配置
  socket: {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  }
};

module.exports = config;