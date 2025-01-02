// https://d3js.org/d3-polygon/ Version 1.0.2. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? factory(exports)
    : typeof define === "function" && define.amd
    ? define(["exports"], factory)
    : factory((global.d3 = global.d3 || {}));
})(this, function (exports) {
  "use strict";

  /**
   * Calculates the area of a polygon
   * @param {Array} polygon - Array of points to represented the vertices of the polygon.
   * @returns {number} The area of the polygon. Returns NaN if the polygon is invalid. (A valid polygon must have at least 3 points)
   */
  var area = function (polygon) {
    if (!polygon || polygon.length < 3) {
      console.error("Invalid polygon:", polygon);
      return NaN; 
    }
  
    var i = -1,
      n = polygon.length,
      a,
      b = polygon[n - 1], 
      area = 0;
  
    while (++i < n) {
      a = b;
      b = polygon[i];
      area += a[1] * b[0] - a[0] * b[1];
    }
  
    return Math.abs(area) / 2; 
  };  
  
  /**
   * Calculates the geometic center (centroid) of a polygon
   * @param {Array} polygon - Array of points to represented the vertices of the polygon. 
   * @returns {Array} The centriod is given by [x, y]
   */
  var centroid = function (polygon) {
    var i = -1,
      n = polygon.length,
      x = 0,
      y = 0,
      a,
      b = polygon[n - 1],
      c,
      k = 0;

    while (++i < n) {
      a = b;
      b = polygon[i];
      k += c = a[0] * b[1] - b[0] * a[1];
      x += (a[0] + b[0]) * c;
      y += (a[1] + b[1]) * c;
    }

    return (k *= 3), [x / k, y / k];
  };

  /**
   * Returns the 2D cross product of AB and AC vectors, i.e. the z-component of the 3D cross product in a quadrant I Cartesian coordinate system (+x is right, +y is up).
   * @param {Array} a -- Point A [x, y].
   * @param {Array} b -- Point B [x, y].
   * @param {Array} c -- Point C [x, y]
   * @returns {number} Positive if ABC is counter-clockwise, negative if clockwise, zero if colinear 
   */
  var cross = function (a, b, c) {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  };

   /**
   * Orders points lexicographically, (A to Z)
   * @param {Array} a - Point A [x, y].
   * @param {Array} b - Point B [x, y].
   * @returns {number} Negative if a < b, positive if a > b, zero if equal.
   */
  function lexicographicOrder(a, b) {
    return a[0] - b[0] || a[1] - b[1];
  }

 /**
   * Computes the upper convex hull of a set of points using the monotone chain algorithm.
   * @param {Array} points - Array of points [x, y].
   * @returns {Array} Array of indices into points in left-to-right order.
   */
  function computeUpperHullIndexes(points) {
    var n = points.length,
      indexes = [0, 1],
      size = 2;

    for (var i = 2; i < n; ++i) {
      while (
        size > 1 &&
        cross(
          points[indexes[size - 2]],
          points[indexes[size - 1]],
          points[i]
        ) <= 0
      )
        --size;
      indexes[size++] = i;
    }

    // remove popped points
    return indexes.slice(0, size); 
  }

  var hull = function (points) {
    if ((n = points.length) < 3) return null;

    var i,
      n,
      sortedPoints = new Array(n),
      flippedPoints = new Array(n);

    for (i = 0; i < n; ++i) sortedPoints[i] = [+points[i][0], +points[i][1], i];
    sortedPoints.sort(lexicographicOrder);
    for (i = 0; i < n; ++i)
      flippedPoints[i] = [sortedPoints[i][0], -sortedPoints[i][1]];

    var upperIndexes = computeUpperHullIndexes(sortedPoints),
      lowerIndexes = computeUpperHullIndexes(flippedPoints);

    // Construct the hull polygon, removing possible duplicate endpoints.
    var skipLeft = lowerIndexes[0] === upperIndexes[0],
      skipRight =
        lowerIndexes[lowerIndexes.length - 1] ===
        upperIndexes[upperIndexes.length - 1],
      hull = [];

    // Add upper hull in right-to-l order.
    // Then add lower hull in left-to-right order.
    for (i = upperIndexes.length - 1; i >= 0; --i)
      hull.push(points[sortedPoints[upperIndexes[i]][2]]);
    for (i = +skipLeft; i < lowerIndexes.length - skipRight; ++i)
      hull.push(points[sortedPoints[lowerIndexes[i]][2]]);

    return hull;
  };

    /**
   * Determines if a point is inside a polygon.
   * @param {Array} polygon - Array of points, representing the vertices of the polygon.
   * @param {Array} point - The point [x, y] to check.
   * @returns {boolean} True if the point is inside the polygon, else false.
   */
  var contains = function (polygon, point) {
    var n = polygon.length,
      p = polygon[n - 1],
      x = point[0],
      y = point[1],
      x0 = p[0],
      y0 = p[1],
      x1,
      y1,
      inside = false;

    for (var i = 0; i < n; ++i) {
      (p = polygon[i]), (x1 = p[0]), (y1 = p[1]);
      if (y1 > y !== y0 > y && x < ((x0 - x1) * (y - y1)) / (y0 - y1) + x1)
        inside = !inside;
      (x0 = x1), (y0 = y1);
    }

    return inside;
  };

  /**
   * Calculates the perimeter of a polygon.
   * @param {Array} polygon - Array of points, representing the vertices of the polygon.
   * @returns {number} The perimeter of the polygon.
   */
  var length = function (polygon) {
    var i = -1,
      n = polygon.length,
      b = polygon[n - 1],
      xa,
      ya,
      xb = b[0],
      yb = b[1],
      perimeter = 0;

    while (++i < n) {
      xa = xb;
      ya = yb;
      b = polygon[i];
      xb = b[0];
      yb = b[1];
      xa -= xb;
      ya -= yb;
      perimeter += Math.sqrt(xa * xa + ya * ya);
    }

    return perimeter;
  };

  exports.polygonArea = area;
  exports.polygonCentroid = centroid;
  exports.polygonHull = hull;
  exports.polygonContains = contains;
  exports.polygonLength = length;

  Object.defineProperty(exports, "__esModule", { value: true });
});
