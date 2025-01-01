import { test, expect } from '@playwright/test';
import { simplifyRadialDist } from '../../../deepnest/main/util/simplify.js'; // Adjust path as necessary

test('removes points within tolerance', async () => {
  const points = [
    { x: 0, y: 0 },
    { x: 0.1, y: 0.1 },
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
  ];
  const sqTolerance = 1; // Square of the tolerance distance
  const simplified = simplifyRadialDist(points, sqTolerance);

  expect(simplified).toEqual([
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
  ]); // Only unique, spaced-out points should remain
});

test('handles empty points array', async () => {
  const points = [];
  const sqTolerance = 1;
  const simplified = simplifyRadialDist(points, sqTolerance);

  expect(simplified).toEqual([]); // Should return an empty array
});

test('handles single point array', async () => {
  const points = [{ x: 0, y: 0 }];
  const sqTolerance = 1;
  const simplified = simplifyRadialDist(points, sqTolerance);

  expect(simplified).toEqual([{ x: 0, y: 0 }]); // Single point remains unchanged
});
