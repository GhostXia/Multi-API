// 统一响应格式工具
class ResponseHandler {
  // 成功响应
  static success(res, data, message = '操作成功') {
    return res.json({
      success: true,
      message,
      data
    });
  }

  // 资源创建成功响应 (201)
  static created(res, data, message = '资源创建成功') {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  }

  // 分页响应
  static paginated(res, data, page, pageSize, total) {
    return res.json({
      success: true,
      message: '查询成功',
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  }

  // 错误响应
  static error(res, message = '操作失败', errors = null, statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }

  // 400 错误响应
  static badRequest(res, message = '参数错误', errors = null) {
    return this.error(res, message, errors, 400);
  }

  // 401 错误响应
  static unauthorized(res, message = '未授权访问') {
    return this.error(res, message, null, 401);
  }

  // 403 错误响应
  static forbidden(res, message = '禁止访问') {
    return this.error(res, message, null, 403);
  }

  // 404 错误响应
  static notFound(res, message = '资源不存在') {
    return this.error(res, message, null, 404);
  }

  // 500 错误响应
  static serverError(res, message = '服务器内部错误', error = null) {
    // 在生产环境下不暴露详细错误信息
    const errors = process.env.NODE_ENV === 'production' ? null : error;
    return this.error(res, message, errors, 500);
  }
}

module.exports = ResponseHandler;