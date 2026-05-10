const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data', 'monopoly.db');

// 确保数据目录存在
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// 初始化数据库表
function initializeDatabase() {
    const usersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
    `;

    const roomsTable = `
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            max_players INTEGER DEFAULT 6,
            status TEXT DEFAULT 'waiting',
            creator_id INTEGER,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (creator_id) REFERENCES users(id)
        )
    `;

    const playersTable = `
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            room_id INTEGER NOT NULL,
            color TEXT NOT NULL,
            position INTEGER DEFAULT 0,
            money INTEGER DEFAULT 1500,
            in_jail INTEGER DEFAULT 0,
            is_ready INTEGER DEFAULT 0,
            is_bankrupt INTEGER DEFAULT 0,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (room_id) REFERENCES rooms(id),
            UNIQUE(user_id, room_id)
        )
    `;

    const propertiesTable = `
        CREATE TABLE IF NOT EXISTS properties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            position INTEGER NOT NULL,
            price INTEGER NOT NULL,
            base_rent INTEGER NOT NULL,
            color_group TEXT NOT NULL,
            house_count INTEGER DEFAULT 0,
            owner_id INTEGER,
            room_id INTEGER NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (owner_id) REFERENCES users(id),
            FOREIGN KEY (room_id) REFERENCES rooms(id)
        )
    `;

    const cardsTable = `
        CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL CHECK(type IN ('chance', 'community')),
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            effect_type TEXT NOT NULL,
            effect_value INTEGER,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
    `;

    const gameEventsTable = `
        CREATE TABLE IF NOT EXISTS game_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL,
            event_type TEXT NOT NULL,
            player_id INTEGER,
            description TEXT,
            data TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (room_id) REFERENCES rooms(id),
            FOREIGN KEY (player_id) REFERENCES players(id)
        )
    `;

    // 执行创建表
    db.serialize(() => {
        db.run(usersTable);
        db.run(roomsTable);
        db.run(playersTable);
        db.run(propertiesTable);
        db.run(cardsTable);
        db.run(gameEventsTable);
        
        console.log('Database tables initialized');
    });
}

// 数据库操作辅助函数
db.run = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
};

db.get = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

db.all = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// 导出数据库连接
module.exports = { db };