const db = require('../config/db');

/**
 * GENERIC PAGINATION HELPER
 * @param {string} baseQuery - The SQL query (before LIMIT/OFFSET)
 * @param {Array} params - Parameters for the baseQuery
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 */
const getPaginatedRes = async (baseQuery, params, page = 1, limit = 10) => {
  try {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Get Total Count
    // We wrap the baseQuery to get the total count accurately
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as subquery`;
    const [[{ total }]] = await db.query(countQuery, params);

    // Get Paginated Data
    const dataQuery = `${baseQuery} LIMIT ? OFFSET ?`;
    const [data] = await db.query(dataQuery, [...params, limitNum, offset]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      data,
      metadata: {
        totalItems: total,
        totalPages,
        currentPage: pageNum,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getPaginatedRes
};
