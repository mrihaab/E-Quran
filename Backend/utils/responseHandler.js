const sendResponse = (res, statusCode, data = {}, message = 'Success') => {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
  };

  return res.status(statusCode).json(response);
};

const sendPaginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

module.exports = { sendResponse, sendPaginatedResponse };
