import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { AssignInitialSalaryDto } from './assign-initial-salary.dto.js';
import { ReviseSalaryDto } from './revise-salary.dto.js';

describe('salary amount validation', () => {
  it.each(['1000', '1000.50', '0.99'])(
    'accepts decimal-friendly amount %s for initial salary',
    async (amount) => {
      const dto = plainToInstance(AssignInitialSalaryDto, {
        amount,
        currencyCode: 'USD',
        effectiveFrom: '2025-01-01',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    },
  );

  it.each(['1,000', 'USD 1000', 'abc'])(
    'rejects invalid amount %s for salary revision',
    async (amount) => {
      const dto = plainToInstance(ReviseSalaryDto, {
        amount,
        currencyCode: 'USD',
        effectiveFrom: '2025-02-01',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    },
  );
});
