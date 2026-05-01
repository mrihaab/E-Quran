const db = require('../config/db');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const getPaginatedRes = async (baseQuery, params = [], page = DEFAULT_PAGE, limit = DEFAULT_LIMIT) => {
  const pageNum = Math.max(1, parseInt(page, 10) || DEFAULT_PAGE);
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT));
  const offset = (pageNum - 1) * limitNum;

  const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`;
  const [[{ total }]] = await db.query(countQuery, params);

  const dataQuery = `${baseQuery} LIMIT ? OFFSET ?`;
  const [data] = await db.query(dataQuery, [...params, limitNum, offset]);

  const totalPages = Math.ceil(total / limitNum);

  return {
    data,
    pagination: {
      total,
      totalPages,
      currentPage: pageNum,
      perPage: limitNum,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    },
  };
};

module.exports = { getPaginatedRes };
