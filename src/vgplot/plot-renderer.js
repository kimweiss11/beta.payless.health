import * as Plot from '@observablehq/plot';
import { Fixed } from './symbols.js';

const ATTRIBUTE_MAP = new Map([
  ['width', 'width'],
  ['height', 'height'],
  ['margin', 'margin'],
  ['marginTop', 'marginTop'],
  ['marginBottom', 'marginBottom'],
  ['marginLeft', 'marginLeft'],
  ['marginRight', 'marginRight'],
  ['domainX', 'x.domain'],
  ['domainY', 'y.domain'],
  ['axisX', 'x.axis'],
  ['axisY', 'y.axis'],
  ['grid', 'grid'],
  ['gridX', 'x.grid'],
  ['gridY', 'y.grid'],
  ['niceX', 'x.nice'],
  ['niceY', 'y.nice'],
  ['zeroX', 'x.zero'],
  ['zeroY', 'y.zero'],
  ['labelX', 'x.label'],
  ['labelY', 'y.label'],
  ['labelAnchorX', 'x.labelAnchor'],
  ['labelAnchorY', 'y.labelAnchor'],
  ['domainColor', 'color.domain'],
  ['rangeColor', 'color.range'],
  ['schemeColor', 'color.scheme'],
  ['interpolateColor', 'color.interpolate']
]);

function setProperty(object, path, value) {
  for (let i = 0; i < path.length; ++i) {
    const key = path[i];
    if (i === path.length - 1) {
      object[key] = value;
    } else {
      object = (object[key] || (object[key] = {}));
    }
  }
}

// construct Plot output
// see https://github.com/observablehq/plot
// TOP-LEVEL
//  width, height, margin(top/right/bottom/left)
//  caption, style, className, document
// SCALES
//  KEYS: x, y, r, color, opacity, length (vectors), symbol (dots)
//  FIELDS: type, domain, range, unknown, reverse, interval, transform
//  QUANT: clamp, nice, zero, percent
//  XY: inset, round, inset(top/bottom/left/right)
//  ORDINAL: padding, align, padding(inner/outer)
//  AXIS: ...
//  COLOR: ..., scheme, interpolate
//  SORT: (manual or use a mark.sort option)
//  FACET: data, x, y, margin(...), grid, label
//   MARK: auto, include, exclude, null
// MARKS
//  TYPES
//    areaX/Y: x1, y1, x2, y2, z
//    barX/Y: x, y, x1, y1, x2, y2
//    rectX/Y: x, y, x1, y1, x2, y2
//    dot, circle, hexagon: x, y, r, rotate, symbol, frameAnchor
//    lineX/Y: x, y, z
//    ruleX/Y
//  STYLES: fill, fillOpacity, stroke, strokeWidth
//    strokeOpacity, strokeLinejoin, strokeLinecap, strokeMiterlimit
//    strokeDasharray, strokeDashoffset
//    opacity, mixBlendMode, shapeRendering, paintOrder
//    dx, dy
//    target, ariaDescription, ariaHidden, pointerEvents, clip
//  CHANNELS: fill, fillOpacity, stroke, strokeOpacity, strokeWidth
//    opacity, title, href, ariaLabel
//  RECTS: inset(...), rx, ry (rounded corners)
//    frameAnchor
export function plotRenderer(plot) {
  const spec = { marks: [] };
  const symbols = [];

  const { attributes, marks } = plot;

  // populate top-level and scale properties
  for (const key in attributes) {
    const specKey = ATTRIBUTE_MAP.get(key);
    if (specKey == null) {
      throw new Error(`Unrecognized plot attribute: ${key}`);
    }
    const value = attributes[key];
    if (typeof value === 'symbol') {
      symbols.push(key);
    } else {
      setProperty(spec, specKey.split('.'), value);
    }
  }

  // populate marks
  for (const mark of marks) {
    const { type, data, options } = mark.toSpec();
    if (type === 'frame') {
      spec.marks.push(Plot[type](options));
    } else {
      spec.marks.push(Plot[type](data, options));
    }
  }

  // render plot
  const svg = Plot.plot(spec);

  // set fixed entries
  symbols.forEach(key => {
    const value = attributes[key];
    if (value === Fixed) {
      let scale;
      switch (key) {
        case 'domainY':
          scale = 'y';
          break;
        case 'domainX':
          scale = 'x';
          break;
        case 'domainColor':
          scale = 'color';
          break;
        default:
          throw new Error(`Unsupported fixed attribute: ${key}`);
      }
      plot.setAttribute(key, svg.scale(scale).domain);
    } else {
      throw new Error(`Unrecognized symbol: ${value}`);
    }
  });

  // initialize interactive selections
  for (const sel of plot.selections) {
    // console.log('INIT SELECTION', svg);
    sel.init(svg);
  }

  return svg;
}