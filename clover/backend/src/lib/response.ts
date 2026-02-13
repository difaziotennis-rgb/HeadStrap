import { Response } from "express";

/** Standard success response */
export function ok(res: Response, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

/** Standard error response */
export function fail(res: Response, error: string, status = 400) {
  return res.status(status).json({ success: false, error });
}

/** Standard paginated response */
export function paginated(
  res: Response,
  data: any[],
  total: number,
  page: number,
  limit: number
) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
