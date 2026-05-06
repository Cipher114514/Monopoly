const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器错误' });
};
module.exports = errorHandler;