/**
 * Country Controller
 * Public endpoints for country metadata
 */

import type { Request, Response, NextFunction } from 'express';
import { CountryService } from '../services/CountryService.js';
import { successResponse } from '../utils/response.js';

export class CountryController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const countries = await CountryService.getActiveCountries();
      successResponse(res, countries);
    } catch (error) {
      next(error);
    }
  }
}

export default CountryController;


