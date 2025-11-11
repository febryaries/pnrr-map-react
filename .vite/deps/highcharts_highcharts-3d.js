import {
  __commonJS
} from "./chunk-G3PMV62Z.js";

// node_modules/highcharts/highcharts-3d.js
var require_highcharts_3d = __commonJS({
  "node_modules/highcharts/highcharts-3d.js"(exports, module) {
    !/**
    * Highcharts JS v11.4.8 (2024-08-29)
    *
    * 3D features for Highcharts JS
    *
    * License: www.highcharts.com/license
    */
    (function(t) {
      "object" == typeof module && module.exports ? (t.default = t, module.exports = t) : "function" == typeof define && define.amd ? define("highcharts/highcharts-3d", ["highcharts"], function(e) {
        return t(e), t.Highcharts = e, t;
      }) : t("undefined" != typeof Highcharts ? Highcharts : void 0);
    })(function(t) {
      "use strict";
      var e = t ? t._modules : {};
      function i(e2, i2, s, o) {
        e2.hasOwnProperty(i2) || (e2[i2] = o.apply(null, s), "function" == typeof CustomEvent && t.win.dispatchEvent(new CustomEvent("HighchartsModuleLoaded", { detail: { path: i2, module: e2[i2] } })));
      }
      i(e, "Core/Math3D.js", [e["Core/Globals.js"], e["Core/Utilities.js"]], function(t2, e2) {
        let { deg2rad: i2 } = t2, { pick: s } = e2;
        function o(t3, e3, o2, a2) {
          let n = e3.options.chart.options3d, l = s(a2, !!o2 && e3.inverted), h = { x: e3.plotWidth / 2, y: e3.plotHeight / 2, z: n.depth / 2, vd: s(n.depth, 1) * s(n.viewDistance, 0) }, p = e3.scale3d || 1, c = i2 * n.beta * (l ? -1 : 1), d = i2 * n.alpha * (l ? -1 : 1), x = { cosA: Math.cos(d), cosB: Math.cos(-c), sinA: Math.sin(d), sinB: Math.sin(-c) };
          return o2 || (h.x += e3.plotLeft, h.y += e3.plotTop), t3.map(function(t4) {
            var e4, i3, s2;
            let o3 = (e4 = (l ? t4.y : t4.x) - h.x, i3 = (l ? t4.x : t4.y) - h.y, s2 = (t4.z || 0) - h.z, { x: x.cosB * e4 - x.sinB * s2, y: -x.sinA * x.sinB * e4 + x.cosA * i3 - x.cosB * x.sinA * s2, z: x.cosA * x.sinB * e4 + x.sinA * i3 + x.cosA * x.cosB * s2 }), a3 = r(o3, h, h.vd);
            return a3.x = a3.x * p + h.x, a3.y = a3.y * p + h.y, a3.z = o3.z * p + h.z, { x: l ? a3.y : a3.x, y: l ? a3.x : a3.y, z: a3.z };
          });
        }
        function r(t3, e3, i3) {
          let s2 = i3 > 0 && i3 < Number.POSITIVE_INFINITY ? i3 / (t3.z + e3.z + i3) : 1;
          return { x: t3.x * s2, y: t3.y * s2 };
        }
        function a(t3) {
          let e3 = 0, i3, s2;
          for (i3 = 0; i3 < t3.length; i3++) s2 = (i3 + 1) % t3.length, e3 += t3[i3].x * t3[s2].y - t3[s2].x * t3[i3].y;
          return e3 / 2;
        }
        return { perspective: o, perspective3D: r, pointCameraDistance: function(t3, e3) {
          let i3 = e3.options.chart.options3d, o2 = { x: e3.plotWidth / 2, y: e3.plotHeight / 2, z: s(i3.depth, 1) * s(i3.viewDistance, 0) + i3.depth };
          return Math.sqrt(Math.pow(o2.x - s(t3.plotX, t3.x), 2) + Math.pow(o2.y - s(t3.plotY, t3.y), 2) + Math.pow(o2.z - s(t3.plotZ, t3.z), 2));
        }, shapeArea: a, shapeArea3D: function(t3, e3, i3) {
          return a(o(t3, e3, i3));
        } };
      }), i(e, "Core/Chart/Chart3D.js", [e["Core/Color/Color.js"], e["Core/Defaults.js"], e["Core/Math3D.js"], e["Core/Utilities.js"]], function(t2, e2, i2, s) {
        var o;
        let { parse: r } = t2, { defaultOptions: a } = e2, { perspective: n, shapeArea3D: l } = i2, { addEvent: h, isArray: p, merge: c, pick: d, wrap: x } = s;
        return (function(t3) {
          function e3(t4) {
            this.is3d() && "scatter" === t4.options.type && (t4.options.type = "scatter3d");
          }
          function i3() {
            if (this.chart3d && this.is3d()) {
              let t4 = this.renderer, e4 = this.options.chart.options3d, i4 = this.chart3d.get3dFrame(), s3 = this.plotLeft, o3 = this.plotLeft + this.plotWidth, a2 = this.plotTop, n2 = this.plotTop + this.plotHeight, l2 = e4.depth, h2 = s3 - (i4.left.visible ? i4.left.size : 0), p2 = o3 + (i4.right.visible ? i4.right.size : 0), c2 = a2 - (i4.top.visible ? i4.top.size : 0), d2 = n2 + (i4.bottom.visible ? i4.bottom.size : 0), x2 = 0 - (i4.front.visible ? i4.front.size : 0), y2 = l2 + (i4.back.visible ? i4.back.size : 0), f2 = this.hasRendered ? "animate" : "attr";
              this.chart3d.frame3d = i4, this.frameShapes || (this.frameShapes = { bottom: t4.polyhedron().add(), top: t4.polyhedron().add(), left: t4.polyhedron().add(), right: t4.polyhedron().add(), back: t4.polyhedron().add(), front: t4.polyhedron().add() }), this.frameShapes.bottom[f2]({ class: "highcharts-3d-frame highcharts-3d-frame-bottom", zIndex: i4.bottom.frontFacing ? -1e3 : 1e3, faces: [{ fill: r(i4.bottom.color).brighten(0.1).get(), vertexes: [{ x: h2, y: d2, z: x2 }, { x: p2, y: d2, z: x2 }, { x: p2, y: d2, z: y2 }, { x: h2, y: d2, z: y2 }], enabled: i4.bottom.visible }, { fill: r(i4.bottom.color).brighten(0.1).get(), vertexes: [{ x: s3, y: n2, z: l2 }, { x: o3, y: n2, z: l2 }, { x: o3, y: n2, z: 0 }, { x: s3, y: n2, z: 0 }], enabled: i4.bottom.visible }, { fill: r(i4.bottom.color).brighten(-0.1).get(), vertexes: [{ x: h2, y: d2, z: x2 }, { x: h2, y: d2, z: y2 }, { x: s3, y: n2, z: l2 }, { x: s3, y: n2, z: 0 }], enabled: i4.bottom.visible && !i4.left.visible }, { fill: r(i4.bottom.color).brighten(-0.1).get(), vertexes: [{ x: p2, y: d2, z: y2 }, { x: p2, y: d2, z: x2 }, { x: o3, y: n2, z: 0 }, { x: o3, y: n2, z: l2 }], enabled: i4.bottom.visible && !i4.right.visible }, { fill: r(i4.bottom.color).get(), vertexes: [{ x: p2, y: d2, z: x2 }, { x: h2, y: d2, z: x2 }, { x: s3, y: n2, z: 0 }, { x: o3, y: n2, z: 0 }], enabled: i4.bottom.visible && !i4.front.visible }, { fill: r(i4.bottom.color).get(), vertexes: [{ x: h2, y: d2, z: y2 }, { x: p2, y: d2, z: y2 }, { x: o3, y: n2, z: l2 }, { x: s3, y: n2, z: l2 }], enabled: i4.bottom.visible && !i4.back.visible }] }), this.frameShapes.top[f2]({ class: "highcharts-3d-frame highcharts-3d-frame-top", zIndex: i4.top.frontFacing ? -1e3 : 1e3, faces: [{ fill: r(i4.top.color).brighten(0.1).get(), vertexes: [{ x: h2, y: c2, z: y2 }, { x: p2, y: c2, z: y2 }, { x: p2, y: c2, z: x2 }, { x: h2, y: c2, z: x2 }], enabled: i4.top.visible }, { fill: r(i4.top.color).brighten(0.1).get(), vertexes: [{ x: s3, y: a2, z: 0 }, { x: o3, y: a2, z: 0 }, { x: o3, y: a2, z: l2 }, { x: s3, y: a2, z: l2 }], enabled: i4.top.visible }, { fill: r(i4.top.color).brighten(-0.1).get(), vertexes: [{ x: h2, y: c2, z: y2 }, { x: h2, y: c2, z: x2 }, { x: s3, y: a2, z: 0 }, { x: s3, y: a2, z: l2 }], enabled: i4.top.visible && !i4.left.visible }, { fill: r(i4.top.color).brighten(-0.1).get(), vertexes: [{ x: p2, y: c2, z: x2 }, { x: p2, y: c2, z: y2 }, { x: o3, y: a2, z: l2 }, { x: o3, y: a2, z: 0 }], enabled: i4.top.visible && !i4.right.visible }, { fill: r(i4.top.color).get(), vertexes: [{ x: h2, y: c2, z: x2 }, { x: p2, y: c2, z: x2 }, { x: o3, y: a2, z: 0 }, { x: s3, y: a2, z: 0 }], enabled: i4.top.visible && !i4.front.visible }, { fill: r(i4.top.color).get(), vertexes: [{ x: p2, y: c2, z: y2 }, { x: h2, y: c2, z: y2 }, { x: s3, y: a2, z: l2 }, { x: o3, y: a2, z: l2 }], enabled: i4.top.visible && !i4.back.visible }] }), this.frameShapes.left[f2]({ class: "highcharts-3d-frame highcharts-3d-frame-left", zIndex: i4.left.frontFacing ? -1e3 : 1e3, faces: [{ fill: r(i4.left.color).brighten(0.1).get(), vertexes: [{ x: h2, y: d2, z: x2 }, { x: s3, y: n2, z: 0 }, { x: s3, y: n2, z: l2 }, { x: h2, y: d2, z: y2 }], enabled: i4.left.visible && !i4.bottom.visible }, { fill: r(i4.left.color).brighten(0.1).get(), vertexes: [{ x: h2, y: c2, z: y2 }, { x: s3, y: a2, z: l2 }, { x: s3, y: a2, z: 0 }, { x: h2, y: c2, z: x2 }], enabled: i4.left.visible && !i4.top.visible }, { fill: r(i4.left.color).brighten(-0.1).get(), vertexes: [{ x: h2, y: d2, z: y2 }, { x: h2, y: c2, z: y2 }, { x: h2, y: c2, z: x2 }, { x: h2, y: d2, z: x2 }], enabled: i4.left.visible }, { fill: r(i4.left.color).brighten(-0.1).get(), vertexes: [{ x: s3, y: a2, z: l2 }, { x: s3, y: n2, z: l2 }, { x: s3, y: n2, z: 0 }, { x: s3, y: a2, z: 0 }], enabled: i4.left.visible }, { fill: r(i4.left.color).get(), vertexes: [{ x: h2, y: d2, z: x2 }, { x: h2, y: c2, z: x2 }, { x: s3, y: a2, z: 0 }, { x: s3, y: n2, z: 0 }], enabled: i4.left.visible && !i4.front.visible }, { fill: r(i4.left.color).get(), vertexes: [{ x: h2, y: c2, z: y2 }, { x: h2, y: d2, z: y2 }, { x: s3, y: n2, z: l2 }, { x: s3, y: a2, z: l2 }], enabled: i4.left.visible && !i4.back.visible }] }), this.frameShapes.right[f2]({ class: "highcharts-3d-frame highcharts-3d-frame-right", zIndex: i4.right.frontFacing ? -1e3 : 1e3, faces: [{ fill: r(i4.right.color).brighten(0.1).get(), vertexes: [{ x: p2, y: d2, z: y2 }, { x: o3, y: n2, z: l2 }, { x: o3, y: n2, z: 0 }, { x: p2, y: d2, z: x2 }], enabled: i4.right.visible && !i4.bottom.visible }, { fill: r(i4.right.color).brighten(0.1).get(), vertexes: [{ x: p2, y: c2, z: x2 }, { x: o3, y: a2, z: 0 }, { x: o3, y: a2, z: l2 }, { x: p2, y: c2, z: y2 }], enabled: i4.right.visible && !i4.top.visible }, { fill: r(i4.right.color).brighten(-0.1).get(), vertexes: [{ x: o3, y: a2, z: 0 }, { x: o3, y: n2, z: 0 }, { x: o3, y: n2, z: l2 }, { x: o3, y: a2, z: l2 }], enabled: i4.right.visible }, { fill: r(i4.right.color).brighten(-0.1).get(), vertexes: [{ x: p2, y: d2, z: x2 }, { x: p2, y: c2, z: x2 }, { x: p2, y: c2, z: y2 }, { x: p2, y: d2, z: y2 }], enabled: i4.right.visible }, { fill: r(i4.right.color).get(), vertexes: [{ x: p2, y: c2, z: x2 }, { x: p2, y: d2, z: x2 }, { x: o3, y: n2, z: 0 }, { x: o3, y: a2, z: 0 }], enabled: i4.right.visible && !i4.front.visible }, { fill: r(i4.right.color).get(), vertexes: [{ x: p2, y: d2, z: y2 }, { x: p2, y: c2, z: y2 }, { x: o3, y: a2, z: l2 }, { x: o3, y: n2, z: l2 }], enabled: i4.right.visible && !i4.back.visible }] }), this.frameShapes.back[f2]({ class: "highcharts-3d-frame highcharts-3d-frame-back", zIndex: i4.back.frontFacing ? -1e3 : 1e3, faces: [{ fill: r(i4.back.color).brighten(0.1).get(), vertexes: [{ x: p2, y: d2, z: y2 }, { x: h2, y: d2, z: y2 }, { x: s3, y: n2, z: l2 }, { x: o3, y: n2, z: l2 }], enabled: i4.back.visible && !i4.bottom.visible }, { fill: r(i4.back.color).brighten(0.1).get(), vertexes: [{ x: h2, y: c2, z: y2 }, { x: p2, y: c2, z: y2 }, { x: o3, y: a2, z: l2 }, { x: s3, y: a2, z: l2 }], enabled: i4.back.visible && !i4.top.visible }, { fill: r(i4.back.color).brighten(-0.1).get(), vertexes: [{ x: h2, y: d2, z: y2 }, { x: h2, y: c2, z: y2 }, { x: s3, y: a2, z: l2 }, { x: s3, y: n2, z: l2 }], enabled: i4.back.visible && !i4.left.visible }, { fill: r(i4.back.color).brighten(-0.1).get(), vertexes: [{ x: p2, y: c2, z: y2 }, { x: p2, y: d2, z: y2 }, { x: o3, y: n2, z: l2 }, { x: o3, y: a2, z: l2 }], enabled: i4.back.visible && !i4.right.visible }, { fill: r(i4.back.color).get(), vertexes: [{ x: s3, y: a2, z: l2 }, { x: o3, y: a2, z: l2 }, { x: o3, y: n2, z: l2 }, { x: s3, y: n2, z: l2 }], enabled: i4.back.visible }, { fill: r(i4.back.color).get(), vertexes: [{ x: h2, y: d2, z: y2 }, { x: p2, y: d2, z: y2 }, { x: p2, y: c2, z: y2 }, { x: h2, y: c2, z: y2 }], enabled: i4.back.visible }] }), this.frameShapes.front[f2]({ class: "highcharts-3d-frame highcharts-3d-frame-front", zIndex: i4.front.frontFacing ? -1e3 : 1e3, faces: [{ fill: r(i4.front.color).brighten(0.1).get(), vertexes: [{ x: h2, y: d2, z: x2 }, { x: p2, y: d2, z: x2 }, { x: o3, y: n2, z: 0 }, { x: s3, y: n2, z: 0 }], enabled: i4.front.visible && !i4.bottom.visible }, { fill: r(i4.front.color).brighten(0.1).get(), vertexes: [{ x: p2, y: c2, z: x2 }, { x: h2, y: c2, z: x2 }, { x: s3, y: a2, z: 0 }, { x: o3, y: a2, z: 0 }], enabled: i4.front.visible && !i4.top.visible }, { fill: r(i4.front.color).brighten(-0.1).get(), vertexes: [{ x: h2, y: c2, z: x2 }, { x: h2, y: d2, z: x2 }, { x: s3, y: n2, z: 0 }, { x: s3, y: a2, z: 0 }], enabled: i4.front.visible && !i4.left.visible }, { fill: r(i4.front.color).brighten(-0.1).get(), vertexes: [{ x: p2, y: d2, z: x2 }, { x: p2, y: c2, z: x2 }, { x: o3, y: a2, z: 0 }, { x: o3, y: n2, z: 0 }], enabled: i4.front.visible && !i4.right.visible }, { fill: r(i4.front.color).get(), vertexes: [{ x: o3, y: a2, z: 0 }, { x: s3, y: a2, z: 0 }, { x: s3, y: n2, z: 0 }, { x: o3, y: n2, z: 0 }], enabled: i4.front.visible }, { fill: r(i4.front.color).get(), vertexes: [{ x: p2, y: d2, z: x2 }, { x: h2, y: d2, z: x2 }, { x: h2, y: c2, z: x2 }, { x: p2, y: c2, z: x2 }], enabled: i4.front.visible }] });
            }
          }
          function s2() {
            this.styledMode && [{ name: "darker", slope: 0.6 }, { name: "brighter", slope: 1.4 }].forEach(function(t4) {
              this.renderer.definition({ tagName: "filter", attributes: { id: "highcharts-" + t4.name }, children: [{ tagName: "feComponentTransfer", children: [{ tagName: "feFuncR", attributes: { type: "linear", slope: t4.slope } }, { tagName: "feFuncG", attributes: { type: "linear", slope: t4.slope } }, { tagName: "feFuncB", attributes: { type: "linear", slope: t4.slope } }] }] });
            }, this);
          }
          function o2() {
            let t4 = this.options;
            this.is3d() && (t4.series || []).forEach(function(e4) {
              "scatter" === (e4.type || t4.chart.type || t4.chart.defaultSeriesType) && (e4.type = "scatter3d");
            });
          }
          function y() {
            let t4 = this.options.chart.options3d;
            if (this.chart3d && this.is3d()) {
              t4 && (t4.alpha = t4.alpha % 360 + (t4.alpha >= 0 ? 0 : 360), t4.beta = t4.beta % 360 + (t4.beta >= 0 ? 0 : 360));
              let e4 = this.inverted, i4 = this.clipBox, s3 = this.margin;
              i4[e4 ? "y" : "x"] = -(s3[3] || 0), i4[e4 ? "x" : "y"] = -(s3[0] || 0), i4[e4 ? "height" : "width"] = this.chartWidth + (s3[3] || 0) + (s3[1] || 0), i4[e4 ? "width" : "height"] = this.chartHeight + (s3[0] || 0) + (s3[2] || 0), this.scale3d = 1, true === t4.fitToPlot && (this.scale3d = this.chart3d.getScale(t4.depth)), this.chart3d.frame3d = this.chart3d.get3dFrame();
            }
          }
          function f() {
            this.is3d() && (this.isDirtyBox = true);
          }
          function u() {
            this.chart3d && this.is3d() && (this.chart3d.frame3d = this.chart3d.get3dFrame());
          }
          function z() {
            this.chart3d || (this.chart3d = new v(this));
          }
          function b(t4) {
            return this.is3d() || t4.apply(this, [].slice.call(arguments, 1));
          }
          function g(t4) {
            let e4, i4 = this.series.length;
            if (this.is3d()) for (; i4--; ) (e4 = this.series[i4]).translate(), e4.render();
            else t4.call(this);
          }
          function m(t4) {
            t4.apply(this, [].slice.call(arguments, 1)), this.is3d() && (this.container.className += " highcharts-3d-chart");
          }
          t3.defaultOptions = { chart: { options3d: { enabled: false, alpha: 0, beta: 0, depth: 100, fitToPlot: true, viewDistance: 25, axisLabelPosition: null, frame: { visible: "default", size: 1, bottom: {}, top: {}, left: {}, right: {}, back: {}, front: {} } } } }, t3.compose = function(r2, n2) {
            let l2 = r2.prototype, d2 = n2.prototype;
            l2.is3d = function() {
              return !!this.options.chart.options3d?.enabled;
            }, l2.propsRequireDirtyBox.push("chart.options3d"), l2.propsRequireUpdateSeries.push("chart.options3d"), d2.matrixSetter = function() {
              let t4;
              if (this.pos < 1 && (p(this.start) || p(this.end))) {
                let e4 = this.start || [1, 0, 0, 1, 0, 0], i4 = this.end || [1, 0, 0, 1, 0, 0];
                t4 = [];
                for (let s3 = 0; s3 < 6; s3++) t4.push(this.pos * i4[s3] + (1 - this.pos) * e4[s3]);
              } else t4 = this.end;
              this.elem.attr(this.prop, t4, null, true);
            }, c(true, a, t3.defaultOptions), h(r2, "init", z), h(r2, "addSeries", e3), h(r2, "afterDrawChartBox", i3), h(r2, "afterGetContainer", s2), h(r2, "afterInit", o2), h(r2, "afterSetChartSize", y), h(r2, "beforeRedraw", f), h(r2, "beforeRender", u), x(l2, "isInsidePlot", b), x(l2, "renderSeries", g), x(l2, "setClassName", m);
          };
          class v {
            constructor(t4) {
              this.chart = t4;
            }
            get3dFrame() {
              let t4 = this.chart, e4 = t4.options.chart.options3d, i4 = e4.frame, s3 = t4.plotLeft, o3 = t4.plotLeft + t4.plotWidth, r2 = t4.plotTop, a2 = t4.plotTop + t4.plotHeight, h2 = e4.depth, p2 = function(e5) {
                let i5 = l(e5, t4);
                return i5 > 0.5 ? 1 : i5 < -0.5 ? -1 : 0;
              }, c2 = p2([{ x: s3, y: a2, z: h2 }, { x: o3, y: a2, z: h2 }, { x: o3, y: a2, z: 0 }, { x: s3, y: a2, z: 0 }]), x2 = p2([{ x: s3, y: r2, z: 0 }, { x: o3, y: r2, z: 0 }, { x: o3, y: r2, z: h2 }, { x: s3, y: r2, z: h2 }]), y2 = p2([{ x: s3, y: r2, z: 0 }, { x: s3, y: r2, z: h2 }, { x: s3, y: a2, z: h2 }, { x: s3, y: a2, z: 0 }]), f2 = p2([{ x: o3, y: r2, z: h2 }, { x: o3, y: r2, z: 0 }, { x: o3, y: a2, z: 0 }, { x: o3, y: a2, z: h2 }]), u2 = p2([{ x: s3, y: a2, z: 0 }, { x: o3, y: a2, z: 0 }, { x: o3, y: r2, z: 0 }, { x: s3, y: r2, z: 0 }]), z2 = p2([{ x: s3, y: r2, z: h2 }, { x: o3, y: r2, z: h2 }, { x: o3, y: a2, z: h2 }, { x: s3, y: a2, z: h2 }]), b2 = false, g2 = false, m2 = false, v2 = false;
              [].concat(t4.xAxis, t4.yAxis, t4.zAxis).forEach(function(t5) {
                t5 && (t5.horiz ? t5.opposite ? g2 = true : b2 = true : t5.opposite ? v2 = true : m2 = true);
              });
              let M = function(t5, e5, i5) {
                let s4 = ["size", "color", "visible"], o4 = {};
                for (let e6 = 0; e6 < s4.length; e6++) {
                  let i6 = s4[e6];
                  for (let e7 = 0; e7 < t5.length; e7++) if ("object" == typeof t5[e7]) {
                    let s5 = t5[e7][i6];
                    if (null != s5) {
                      o4[i6] = s5;
                      break;
                    }
                  }
                }
                let r3 = i5;
                return true === o4.visible || false === o4.visible ? r3 = o4.visible : "auto" === o4.visible && (r3 = e5 > 0), { size: d(o4.size, 1), color: d(o4.color, "none"), frontFacing: e5 > 0, visible: r3 };
              }, S = { axes: {}, bottom: M([i4.bottom, i4.top, i4], c2, b2), top: M([i4.top, i4.bottom, i4], x2, g2), left: M([i4.left, i4.right, i4.side, i4], y2, m2), right: M([i4.right, i4.left, i4.side, i4], f2, v2), back: M([i4.back, i4.front, i4], z2, true), front: M([i4.front, i4.back, i4], u2, false) };
              if ("auto" === e4.axisLabelPosition) {
                let e5 = function(t5, e6) {
                  return t5.visible !== e6.visible || t5.visible && e6.visible && t5.frontFacing !== e6.frontFacing;
                }, i5 = [];
                e5(S.left, S.front) && i5.push({ y: (r2 + a2) / 2, x: s3, z: 0, xDir: { x: 1, y: 0, z: 0 } }), e5(S.left, S.back) && i5.push({ y: (r2 + a2) / 2, x: s3, z: h2, xDir: { x: 0, y: 0, z: -1 } }), e5(S.right, S.front) && i5.push({ y: (r2 + a2) / 2, x: o3, z: 0, xDir: { x: 0, y: 0, z: 1 } }), e5(S.right, S.back) && i5.push({ y: (r2 + a2) / 2, x: o3, z: h2, xDir: { x: -1, y: 0, z: 0 } });
                let l2 = [];
                e5(S.bottom, S.front) && l2.push({ x: (s3 + o3) / 2, y: a2, z: 0, xDir: { x: 1, y: 0, z: 0 } }), e5(S.bottom, S.back) && l2.push({ x: (s3 + o3) / 2, y: a2, z: h2, xDir: { x: -1, y: 0, z: 0 } });
                let p3 = [];
                e5(S.top, S.front) && p3.push({ x: (s3 + o3) / 2, y: r2, z: 0, xDir: { x: 1, y: 0, z: 0 } }), e5(S.top, S.back) && p3.push({ x: (s3 + o3) / 2, y: r2, z: h2, xDir: { x: -1, y: 0, z: 0 } });
                let c3 = [];
                e5(S.bottom, S.left) && c3.push({ z: (0 + h2) / 2, y: a2, x: s3, xDir: { x: 0, y: 0, z: -1 } }), e5(S.bottom, S.right) && c3.push({ z: (0 + h2) / 2, y: a2, x: o3, xDir: { x: 0, y: 0, z: 1 } });
                let d2 = [];
                e5(S.top, S.left) && d2.push({ z: (0 + h2) / 2, y: r2, x: s3, xDir: { x: 0, y: 0, z: -1 } }), e5(S.top, S.right) && d2.push({ z: (0 + h2) / 2, y: r2, x: o3, xDir: { x: 0, y: 0, z: 1 } });
                let x3 = function(e6, i6, s4) {
                  if (0 === e6.length) return null;
                  if (1 === e6.length) return e6[0];
                  let o4 = n(e6, t4, false), r3 = 0;
                  for (let t5 = 1; t5 < o4.length; t5++) s4 * o4[t5][i6] > s4 * o4[r3][i6] ? r3 = t5 : s4 * o4[t5][i6] == s4 * o4[r3][i6] && o4[t5].z < o4[r3].z && (r3 = t5);
                  return e6[r3];
                };
                S.axes = { y: { left: x3(i5, "x", -1), right: x3(i5, "x", 1) }, x: { top: x3(p3, "y", -1), bottom: x3(l2, "y", 1) }, z: { top: x3(d2, "y", -1), bottom: x3(c3, "y", 1) } };
              } else S.axes = { y: { left: { x: s3, z: 0, xDir: { x: 1, y: 0, z: 0 } }, right: { x: o3, z: 0, xDir: { x: 0, y: 0, z: 1 } } }, x: { top: { y: r2, z: 0, xDir: { x: 1, y: 0, z: 0 } }, bottom: { y: a2, z: 0, xDir: { x: 1, y: 0, z: 0 } } }, z: { top: { x: m2 ? o3 : s3, y: r2, xDir: m2 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 0, z: -1 } }, bottom: { x: m2 ? o3 : s3, y: a2, xDir: m2 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 0, z: -1 } } } };
              return S;
            }
            getScale(t4) {
              let e4 = this.chart, i4 = e4.plotLeft, s3 = e4.plotWidth + i4, o3 = e4.plotTop, r2 = e4.plotHeight + o3, a2 = i4 + e4.plotWidth / 2, l2 = o3 + e4.plotHeight / 2, h2 = { minX: Number.MAX_VALUE, maxX: -Number.MAX_VALUE, minY: Number.MAX_VALUE, maxY: -Number.MAX_VALUE }, p2, c2 = 1;
              return p2 = [{ x: i4, y: o3, z: 0 }, { x: i4, y: o3, z: t4 }], [0, 1].forEach(function(t5) {
                p2.push({ x: s3, y: p2[t5].y, z: p2[t5].z });
              }), [0, 1, 2, 3].forEach(function(t5) {
                p2.push({ x: p2[t5].x, y: r2, z: p2[t5].z });
              }), (p2 = n(p2, e4, false)).forEach(function(t5) {
                h2.minX = Math.min(h2.minX, t5.x), h2.maxX = Math.max(h2.maxX, t5.x), h2.minY = Math.min(h2.minY, t5.y), h2.maxY = Math.max(h2.maxY, t5.y);
              }), i4 > h2.minX && (c2 = Math.min(c2, 1 - Math.abs((i4 + a2) / (h2.minX + a2)) % 1)), s3 < h2.maxX && (c2 = Math.min(c2, (s3 - a2) / (h2.maxX - a2))), o3 > h2.minY && (c2 = h2.minY < 0 ? Math.min(c2, (o3 + l2) / (-h2.minY + o3 + l2)) : Math.min(c2, 1 - (o3 + l2) / (h2.minY + l2) % 1)), r2 < h2.maxY && (c2 = Math.min(c2, Math.abs((r2 - l2) / (h2.maxY - l2)))), c2;
            }
          }
          t3.Additions = v;
        })(o || (o = {})), o;
      }), i(e, "Series/Area3D/Area3DSeries.js", [e["Core/Globals.js"], e["Core/Math3D.js"], e["Core/Series/SeriesRegistry.js"], e["Core/Utilities.js"]], function(t2, e2, i2, s) {
        let { composed: o } = t2, { perspective: r } = e2, { line: { prototype: a } } = i2.seriesTypes, { pushUnique: n, wrap: l } = s;
        function h(t3) {
          let e3 = t3.apply(this, [].slice.call(arguments, 1));
          if (!this.chart.is3d()) return e3;
          let i3 = a.getGraphPath, s2 = this.options, o2 = Math.round(this.yAxis.getThreshold(s2.threshold)), n2 = [];
          if (this.rawPointsX) for (let t4 = 0; t4 < this.points.length; t4++) n2.push({ x: this.rawPointsX[t4], y: s2.stacking ? this.points[t4].yBottom : o2, z: this.zPadding });
          let l2 = this.chart.options.chart.options3d;
          n2 = r(n2, this.chart, true).map((t4) => ({ plotX: t4.x, plotY: t4.y, plotZ: t4.z })), this.group && l2 && l2.depth && l2.beta && (this.markerGroup && (this.markerGroup.add(this.group), this.markerGroup.attr({ translateX: 0, translateY: 0 })), this.group.attr({ zIndex: Math.max(1, l2.beta > 270 || l2.beta < 90 ? l2.depth - Math.round(this.zPadding || 0) : Math.round(this.zPadding || 0)) })), n2.reversed = true;
          let h2 = i3.call(this, n2, true, true);
          if (h2[0] && "M" === h2[0][0] && (h2[0] = ["L", h2[0][1], h2[0][2]]), this.areaPath) {
            let t4 = this.areaPath.splice(0, this.areaPath.length / 2).concat(h2);
            t4.xMap = this.areaPath.xMap, this.areaPath = t4;
          }
          return this.graphPath = e3, e3;
        }
        return { compose: function(t3) {
          n(o, "Area3DSeries") && l(t3.prototype, "getGraphPath", h);
        } };
      }), i(e, "Core/Axis/Axis3DDefaults.js", [], function() {
        return { labels: { position3d: "offset", skew3d: false }, title: { position3d: null, skew3d: null } };
      }), i(e, "Core/Axis/Tick3DComposition.js", [e["Core/Globals.js"], e["Core/Utilities.js"]], function(t2, e2) {
        let { composed: i2 } = t2, { addEvent: s, extend: o, pushUnique: r, wrap: a } = e2;
        function n(t3) {
          let e3 = this.axis.axis3D;
          e3 && o(t3.pos, e3.fix3dPosition(t3.pos));
        }
        function l(t3) {
          let e3 = this.axis.axis3D, i3 = t3.apply(this, [].slice.call(arguments, 1));
          if (e3) {
            let t4 = i3[0], s2 = i3[1];
            if ("M" === t4[0] && "L" === s2[0]) {
              let i4 = [e3.fix3dPosition({ x: t4[1], y: t4[2], z: 0 }), e3.fix3dPosition({ x: s2[1], y: s2[2], z: 0 })];
              return this.axis.chart.renderer.toLineSegments(i4);
            }
          }
          return i3;
        }
        return { compose: function(t3) {
          r(i2, "Axis.Tick3D") && (s(t3, "afterGetLabelPosition", n), a(t3.prototype, "getMarkPath", l));
        } };
      }), i(e, "Core/Axis/Axis3DComposition.js", [e["Core/Axis/Axis3DDefaults.js"], e["Core/Defaults.js"], e["Core/Globals.js"], e["Core/Math3D.js"], e["Core/Axis/Tick3DComposition.js"], e["Core/Utilities.js"]], function(t2, e2, i2, s, o, r) {
        let { defaultOptions: a } = e2, { deg2rad: n } = i2, { perspective: l, perspective3D: h, shapeArea: p } = s, { addEvent: c, merge: d, pick: x, wrap: y } = r;
        function f() {
          let t3 = this.chart, e3 = this.options;
          t3.is3d && t3.is3d() && "colorAxis" !== this.coll && (e3.tickWidth = x(e3.tickWidth, 0), e3.gridLineWidth = x(e3.gridLineWidth, 1));
        }
        function u(t3) {
          this.chart.is3d() && "colorAxis" !== this.coll && t3.point && (t3.point.crosshairPos = this.isXAxis ? t3.point.axisXpos : this.len - t3.point.axisYpos);
        }
        function z() {
          this.axis3D || (this.axis3D = new S(this));
        }
        function b(t3) {
          return this.chart.is3d() && "colorAxis" !== this.coll ? [] : t3.apply(this, [].slice.call(arguments, 1));
        }
        function g(t3) {
          if (!this.chart.is3d() || "colorAxis" === this.coll) return t3.apply(this, [].slice.call(arguments, 1));
          let e3 = arguments, i3 = e3[1], s2 = e3[2], o2 = [], r2 = this.getPlotLinePath({ value: i3 }), a2 = this.getPlotLinePath({ value: s2 });
          if (r2 && a2) for (let t4 = 0; t4 < r2.length; t4 += 2) {
            let e4 = r2[t4], i4 = r2[t4 + 1], s3 = a2[t4], n2 = a2[t4 + 1];
            "M" === e4[0] && "L" === i4[0] && "M" === s3[0] && "L" === n2[0] && o2.push(e4, i4, n2, ["L", s3[1], s3[2]], ["Z"]);
          }
          return o2;
        }
        function m(t3) {
          let e3 = this.axis3D, i3 = this.chart, s2 = t3.apply(this, [].slice.call(arguments, 1));
          if ("colorAxis" === this.coll || !i3.chart3d || !i3.is3d() || null === s2) return s2;
          let o2 = i3.options.chart.options3d, r2 = this.isZAxis ? i3.plotWidth : o2.depth, a2 = i3.chart3d.frame3d, n2 = s2[0], h2 = s2[1], p2, c2 = [];
          return "M" === n2[0] && "L" === h2[0] && (p2 = [e3.swapZ({ x: n2[1], y: n2[2], z: 0 }), e3.swapZ({ x: n2[1], y: n2[2], z: r2 }), e3.swapZ({ x: h2[1], y: h2[2], z: 0 }), e3.swapZ({ x: h2[1], y: h2[2], z: r2 })], this.horiz ? (this.isZAxis ? (a2.left.visible && c2.push(p2[0], p2[2]), a2.right.visible && c2.push(p2[1], p2[3])) : (a2.front.visible && c2.push(p2[0], p2[2]), a2.back.visible && c2.push(p2[1], p2[3])), a2.top.visible && c2.push(p2[0], p2[1]), a2.bottom.visible && c2.push(p2[2], p2[3])) : (a2.front.visible && c2.push(p2[0], p2[2]), a2.back.visible && c2.push(p2[1], p2[3]), a2.left.visible && c2.push(p2[0], p2[1]), a2.right.visible && c2.push(p2[2], p2[3])), c2 = l(c2, this.chart, false)), i3.renderer.toLineSegments(c2);
        }
        function v(t3, e3) {
          let { chart: i3, gridGroup: s2, tickPositions: o2, ticks: r2 } = this;
          if (this.categories && i3.frameShapes && i3.is3d() && s2 && e3 && e3.label) {
            let t4, a2, n2;
            let l2 = s2.element.childNodes[0].getBBox(), p2 = i3.frameShapes.left.getBBox(), c2 = i3.options.chart.options3d, d2 = { x: i3.plotWidth / 2, y: i3.plotHeight / 2, z: c2.depth / 2, vd: x(c2.depth, 1) * x(c2.viewDistance, 0) }, y2 = o2.indexOf(e3.pos), f2 = r2[o2[y2 - 1]], u2 = r2[o2[y2 + 1]];
            return f2?.label?.xy && (a2 = h({ x: f2.label.xy.x, y: f2.label.xy.y, z: null }, d2, d2.vd)), u2 && u2.label && u2.label.xy && (n2 = h({ x: u2.label.xy.x, y: u2.label.xy.y, z: null }, d2, d2.vd)), t4 = h(t4 = { x: e3.label.xy.x, y: e3.label.xy.y, z: null }, d2, d2.vd), Math.abs(a2 ? t4.x - a2.x : n2 ? n2.x - t4.x : l2.x - p2.x);
          }
          return t3.apply(this, [].slice.call(arguments, 1));
        }
        function M(t3) {
          let e3 = t3.apply(this, [].slice.call(arguments, 1));
          return this.axis3D ? this.axis3D.fix3dPosition(e3, true) : e3;
        }
        class S {
          static compose(e3, i3) {
            if (o.compose(i3), !e3.keepProps.includes("axis3D")) {
              d(true, a.xAxis, t2), e3.keepProps.push("axis3D"), c(e3, "init", z), c(e3, "afterSetOptions", f), c(e3, "drawCrosshair", u);
              let i4 = e3.prototype;
              y(i4, "getLinePath", b), y(i4, "getPlotBandPath", g), y(i4, "getPlotLinePath", m), y(i4, "getSlotWidth", v), y(i4, "getTitlePosition", M);
            }
          }
          constructor(t3) {
            this.axis = t3;
          }
          fix3dPosition(t3, e3) {
            let i3 = this.axis, s2 = i3.chart;
            if ("colorAxis" === i3.coll || !s2.chart3d || !s2.is3d()) return t3;
            let o2 = n * s2.options.chart.options3d.alpha, r2 = n * s2.options.chart.options3d.beta, a2 = x(e3 && i3.options.title.position3d, i3.options.labels.position3d), h2 = x(e3 && i3.options.title.skew3d, i3.options.labels.skew3d), c2 = s2.chart3d.frame3d, d2 = s2.plotLeft, y2 = s2.plotWidth + d2, f2 = s2.plotTop, u2 = s2.plotHeight + f2, z2 = 0, b2 = 0, g2, m2 = { x: 0, y: 1, z: 0 }, v2 = false;
            if (t3 = i3.axis3D.swapZ({ x: t3.x, y: t3.y, z: 0 }), i3.isZAxis) {
              if (i3.opposite) {
                if (null === c2.axes.z.top) return {};
                b2 = t3.y - f2, t3.x = c2.axes.z.top.x, t3.y = c2.axes.z.top.y, g2 = c2.axes.z.top.xDir, v2 = !c2.top.frontFacing;
              } else {
                if (null === c2.axes.z.bottom) return {};
                b2 = t3.y - u2, t3.x = c2.axes.z.bottom.x, t3.y = c2.axes.z.bottom.y, g2 = c2.axes.z.bottom.xDir, v2 = !c2.bottom.frontFacing;
              }
            } else if (i3.horiz) {
              if (i3.opposite) {
                if (null === c2.axes.x.top) return {};
                b2 = t3.y - f2, t3.y = c2.axes.x.top.y, t3.z = c2.axes.x.top.z, g2 = c2.axes.x.top.xDir, v2 = !c2.top.frontFacing;
              } else {
                if (null === c2.axes.x.bottom) return {};
                b2 = t3.y - u2, t3.y = c2.axes.x.bottom.y, t3.z = c2.axes.x.bottom.z, g2 = c2.axes.x.bottom.xDir, v2 = !c2.bottom.frontFacing;
              }
            } else if (i3.opposite) {
              if (null === c2.axes.y.right) return {};
              z2 = t3.x - y2, t3.x = c2.axes.y.right.x, t3.z = c2.axes.y.right.z, g2 = { x: (g2 = c2.axes.y.right.xDir).z, y: g2.y, z: -g2.x };
            } else {
              if (null === c2.axes.y.left) return {};
              z2 = t3.x - d2, t3.x = c2.axes.y.left.x, t3.z = c2.axes.y.left.z, g2 = c2.axes.y.left.xDir;
            }
            if ("chart" === a2) ;
            else if ("flap" === a2) {
              if (i3.horiz) {
                let t4 = Math.sin(o2), e4 = Math.cos(o2);
                i3.opposite && (t4 = -t4), v2 && (t4 = -t4), m2 = { x: g2.z * t4, y: e4, z: -g2.x * t4 };
              } else g2 = { x: Math.cos(r2), y: 0, z: Math.sin(r2) };
            } else if ("ortho" === a2) {
              if (i3.horiz) {
                let t4 = Math.sin(o2), e4 = Math.cos(o2), i4 = { x: Math.sin(r2) * e4, y: -t4, z: -e4 * Math.cos(r2) }, s3 = 1 / Math.sqrt((m2 = { x: g2.y * i4.z - g2.z * i4.y, y: g2.z * i4.x - g2.x * i4.z, z: g2.x * i4.y - g2.y * i4.x }).x * m2.x + m2.y * m2.y + m2.z * m2.z);
                v2 && (s3 = -s3), m2 = { x: s3 * m2.x, y: s3 * m2.y, z: s3 * m2.z };
              } else g2 = { x: Math.cos(r2), y: 0, z: Math.sin(r2) };
            } else i3.horiz ? m2 = { x: Math.sin(r2) * Math.sin(o2), y: Math.cos(o2), z: -Math.cos(r2) * Math.sin(o2) } : g2 = { x: Math.cos(r2), y: 0, z: Math.sin(r2) };
            t3.x += z2 * g2.x + b2 * m2.x, t3.y += z2 * g2.y + b2 * m2.y, t3.z += z2 * g2.z + b2 * m2.z;
            let M2 = l([t3], i3.chart)[0];
            if (h2) {
              0 > p(l([t3, { x: t3.x + g2.x, y: t3.y + g2.y, z: t3.z + g2.z }, { x: t3.x + m2.x, y: t3.y + m2.y, z: t3.z + m2.z }], i3.chart)) && (g2 = { x: -g2.x, y: -g2.y, z: -g2.z });
              let e4 = l([{ x: t3.x, y: t3.y, z: t3.z }, { x: t3.x + g2.x, y: t3.y + g2.y, z: t3.z + g2.z }, { x: t3.x + m2.x, y: t3.y + m2.y, z: t3.z + m2.z }], i3.chart);
              M2.matrix = [e4[1].x - e4[0].x, e4[1].y - e4[0].y, e4[2].x - e4[0].x, e4[2].y - e4[0].y, M2.x, M2.y], M2.matrix[4] -= M2.x * M2.matrix[0] + M2.y * M2.matrix[2], M2.matrix[5] -= M2.x * M2.matrix[1] + M2.y * M2.matrix[3];
            }
            return M2;
          }
          swapZ(t3, e3) {
            let i3 = this.axis;
            if (i3.isZAxis) {
              let s2 = e3 ? 0 : i3.chart.plotLeft;
              return { x: s2 + t3.z, y: t3.y, z: t3.x - s2 };
            }
            return t3;
          }
        }
        return S;
      }), i(e, "Core/Series/Series3D.js", [e["Core/Globals.js"], e["Core/Math3D.js"], e["Core/Series/Series.js"], e["Core/Utilities.js"]], function(t2, e2, i2, s) {
        let { composed: o } = t2, { perspective: r } = e2, { addEvent: a, extend: n, isNumber: l, merge: h, pick: p, pushUnique: c } = s;
        class d extends i2 {
          static compose(t3) {
            c(o, "Core.Series3D") && (a(t3, "afterTranslate", function() {
              this.chart.is3d() && this.translate3dPoints();
            }), n(t3.prototype, { translate3dPoints: d.prototype.translate3dPoints }));
          }
          translate3dPoints() {
            let t3, e3;
            let i3 = this, s2 = i3.options, o2 = i3.chart, a2 = p(i3.zAxis, o2.options.zAxis[0]), n2 = [], h2 = [], c2 = s2.stacking ? l(s2.stack) ? s2.stack : 0 : i3.index || 0;
            i3.zPadding = c2 * (s2.depth || 0 + (s2.groupZPadding || 1)), i3.data.forEach((t4) => {
              a2 && a2.translate ? (e3 = a2.logarithmic && a2.val2lin ? a2.val2lin(t4.z) : t4.z, t4.plotZ = a2.translate(e3), t4.isInside = !!t4.isInside && e3 >= a2.min && e3 <= a2.max) : t4.plotZ = i3.zPadding, t4.axisXpos = t4.plotX, t4.axisYpos = t4.plotY, t4.axisZpos = t4.plotZ, n2.push({ x: t4.plotX, y: t4.plotY, z: t4.plotZ }), h2.push(t4.plotX || 0);
            }), i3.rawPointsX = h2;
            let d2 = r(n2, o2, true);
            i3.data.forEach((e4, i4) => {
              t3 = d2[i4], e4.plotX = t3.x, e4.plotY = t3.y, e4.plotZ = t3.z;
            });
          }
        }
        return d.defaultOptions = h(i2.defaultOptions), d;
      }), i(e, "Core/Renderer/SVG/SVGElement3D.js", [e["Core/Color/Color.js"], e["Core/Renderer/RendererRegistry.js"], e["Core/Utilities.js"]], function(t2, e2, i2) {
        let { parse: s } = t2, { Element: o } = e2.getRendererType().prototype, { defined: r, pick: a } = i2;
        class n extends o {
          constructor() {
            super(...arguments), this.parts = ["front", "top", "side"], this.pathType = "cuboid";
          }
          initArgs(t3) {
            let e3 = this.renderer, i3 = e3[this.pathType + "Path"](t3), s2 = i3.zIndexes;
            for (let t4 of this.parts) {
              let o2 = { class: "highcharts-3d-" + t4, zIndex: s2[t4] || 0 };
              e3.styledMode && ("top" === t4 ? o2.filter = "url(#highcharts-brighter)" : "side" === t4 && (o2.filter = "url(#highcharts-darker)")), this[t4] = e3.path(i3[t4]).attr(o2).add(this);
            }
            this.attr({ "stroke-linejoin": "round", zIndex: s2.group }), this.forcedSides = i3.forcedSides;
          }
          singleSetterForParts(t3, e3, i3, s2, o2, r2) {
            let a2 = {}, n2 = [null, null, s2 || "attr", o2, r2], l = i3 && i3.zIndexes;
            if (i3) {
              for (let e4 of (l && l.group && this.attr({ zIndex: l.group }), Object.keys(i3))) a2[e4] = {}, a2[e4][t3] = i3[e4], l && (a2[e4].zIndex = i3.zIndexes[e4] || 0);
              n2[1] = a2;
            } else a2[t3] = e3, n2[0] = a2;
            return this.processParts.apply(this, n2);
          }
          processParts(t3, e3, i3, s2, o2) {
            for (let r2 of this.parts) e3 && (t3 = a(e3[r2], false)), false !== t3 && this[r2][i3](t3, s2, o2);
            return this;
          }
          destroy() {
            return this.processParts(null, null, "destroy"), super.destroy();
          }
          attr(t3, e3, i3, s2) {
            if ("string" == typeof t3 && void 0 !== e3) {
              let i4 = t3;
              (t3 = {})[i4] = e3;
            }
            return t3.shapeArgs || r(t3.x) ? this.singleSetterForParts("d", null, this.renderer[this.pathType + "Path"](t3.shapeArgs || t3)) : super.attr(t3, void 0, i3, s2);
          }
          animate(t3, e3, i3) {
            if (r(t3.x) && r(t3.y)) {
              let s2 = this.renderer[this.pathType + "Path"](t3), o2 = s2.forcedSides;
              this.singleSetterForParts("d", null, s2, "animate", e3, i3), this.attr({ zIndex: s2.zIndexes.group }), o2 === this.forcedSides || (this.forcedSides = o2, this.renderer.styledMode || this.fillSetter(this.fill));
            } else super.animate(t3, e3, i3);
            return this;
          }
          fillSetter(t3) {
            return this.forcedSides = this.forcedSides || [], this.singleSetterForParts("fill", null, { front: t3, top: s(t3).brighten(this.forcedSides.indexOf("top") >= 0 ? 0 : 0.1).get(), side: s(t3).brighten(this.forcedSides.indexOf("side") >= 0 ? 0 : -0.1).get() }), this.color = this.fill = t3, this;
          }
        }
        return n.types = { base: n, cuboid: n }, n;
      }), i(e, "Core/Renderer/SVG/SVGRenderer3D.js", [e["Core/Animation/AnimationUtilities.js"], e["Core/Color/Color.js"], e["Core/Globals.js"], e["Core/Math3D.js"], e["Core/Renderer/SVG/SVGElement3D.js"], e["Core/Utilities.js"]], function(t2, e2, i2, s, o, r) {
        var a;
        let { animObject: n } = t2, { parse: l } = e2, { charts: h, deg2rad: p } = i2, { perspective: c, shapeArea: d } = s, { defined: x, extend: y, merge: f, pick: u } = r, z = Math.cos, b = Math.sin, g = Math.PI, m = 4 * (Math.sqrt(2) - 1) / 3 / (g / 2);
        function v(t3, e3, i3, s2, o2, r2, a2, n2) {
          let l2 = r2 - o2, h2 = [];
          return r2 > o2 && r2 - o2 > Math.PI / 2 + 1e-4 ? h2 = (h2 = h2.concat(v(t3, e3, i3, s2, o2, o2 + Math.PI / 2, a2, n2))).concat(v(t3, e3, i3, s2, o2 + Math.PI / 2, r2, a2, n2)) : r2 < o2 && o2 - r2 > Math.PI / 2 + 1e-4 ? h2 = (h2 = h2.concat(v(t3, e3, i3, s2, o2, o2 - Math.PI / 2, a2, n2))).concat(v(t3, e3, i3, s2, o2 - Math.PI / 2, r2, a2, n2)) : [["C", t3 + i3 * Math.cos(o2) - i3 * m * l2 * Math.sin(o2) + a2, e3 + s2 * Math.sin(o2) + s2 * m * l2 * Math.cos(o2) + n2, t3 + i3 * Math.cos(r2) + i3 * m * l2 * Math.sin(r2) + a2, e3 + s2 * Math.sin(r2) - s2 * m * l2 * Math.cos(r2) + n2, t3 + i3 * Math.cos(r2) + a2, e3 + s2 * Math.sin(r2) + n2]];
        }
        return (function(t3) {
          function e3(t4, e4) {
            let i3 = [];
            for (let e5 of t4) i3.push(["L", e5.x, e5.y]);
            return t4.length && (i3[0][0] = "M", e4 && i3.push(["Z"])), i3;
          }
          function s2(t4) {
            let e4 = [], i3 = true;
            for (let s3 of t4) e4.push(i3 ? ["M", s3.x, s3.y] : ["L", s3.x, s3.y]), i3 = !i3;
            return e4;
          }
          function r2(t4) {
            let e4 = this, i3 = e4.Element.prototype, s3 = e4.createElement("path");
            return s3.vertexes = [], s3.insidePlotArea = false, s3.enabled = true, s3.attr = function(t5) {
              if ("object" == typeof t5 && (x(t5.enabled) || x(t5.vertexes) || x(t5.insidePlotArea))) {
                this.enabled = u(t5.enabled, this.enabled), this.vertexes = u(t5.vertexes, this.vertexes), this.insidePlotArea = u(t5.insidePlotArea, this.insidePlotArea), delete t5.enabled, delete t5.vertexes, delete t5.insidePlotArea;
                let i4 = h[e4.chartIndex], s4 = c(this.vertexes, i4, this.insidePlotArea), o2 = e4.toLinePath(s4, true), r3 = d(s4);
                t5.d = o2, t5.visibility = this.enabled && r3 > 0 ? "inherit" : "hidden";
              }
              return i3.attr.apply(this, arguments);
            }, s3.animate = function(t5) {
              if ("object" == typeof t5 && (x(t5.enabled) || x(t5.vertexes) || x(t5.insidePlotArea))) {
                this.enabled = u(t5.enabled, this.enabled), this.vertexes = u(t5.vertexes, this.vertexes), this.insidePlotArea = u(t5.insidePlotArea, this.insidePlotArea), delete t5.enabled, delete t5.vertexes, delete t5.insidePlotArea;
                let i4 = h[e4.chartIndex], s4 = c(this.vertexes, i4, this.insidePlotArea), o2 = e4.toLinePath(s4, true), r3 = d(s4), a3 = this.enabled && r3 > 0 ? "visible" : "hidden";
                t5.d = o2, this.attr("visibility", a3);
              }
              return i3.animate.apply(this, arguments);
            }, s3.attr(t4);
          }
          function a2(t4) {
            let e4 = this, i3 = e4.Element.prototype, s3 = e4.g(), o2 = s3.destroy;
            return this.styledMode || s3.attr({ "stroke-linejoin": "round" }), s3.faces = [], s3.destroy = function() {
              for (let t5 = 0; t5 < s3.faces.length; t5++) s3.faces[t5].destroy();
              return o2.call(this);
            }, s3.attr = function(t5, o3, r3, a3) {
              if ("object" == typeof t5 && x(t5.faces)) {
                for (; s3.faces.length > t5.faces.length; ) s3.faces.pop().destroy();
                for (; s3.faces.length < t5.faces.length; ) s3.faces.push(e4.face3d().add(s3));
                for (let i4 = 0; i4 < t5.faces.length; i4++) e4.styledMode && delete t5.faces[i4].fill, s3.faces[i4].attr(t5.faces[i4], null, r3, a3);
                delete t5.faces;
              }
              return i3.attr.apply(this, arguments);
            }, s3.animate = function(t5, o3, r3) {
              if (t5 && t5.faces) {
                for (; s3.faces.length > t5.faces.length; ) s3.faces.pop().destroy();
                for (; s3.faces.length < t5.faces.length; ) s3.faces.push(e4.face3d().add(s3));
                for (let e5 = 0; e5 < t5.faces.length; e5++) s3.faces[e5].animate(t5.faces[e5], o3, r3);
                delete t5.faces;
              }
              return i3.animate.apply(this, arguments);
            }, s3.attr(t4);
          }
          function m2(t4, e4) {
            let i3 = new o.types[t4](this, "g");
            return i3.initArgs(e4), i3;
          }
          function M(t4) {
            return this.element3d("cuboid", t4);
          }
          function S(t4) {
            let e4 = t4.x || 0, i3 = t4.y || 0, s3 = t4.z || 0, o2 = t4.height || 0, r3 = t4.width || 0, a3 = t4.depth || 0, n2 = h[this.chartIndex], l2 = n2.options.chart.options3d.alpha, p2 = [], x2, y2 = 0, f2 = [{ x: e4, y: i3, z: s3 }, { x: e4 + r3, y: i3, z: s3 }, { x: e4 + r3, y: i3 + o2, z: s3 }, { x: e4, y: i3 + o2, z: s3 }, { x: e4, y: i3 + o2, z: s3 + a3 }, { x: e4 + r3, y: i3 + o2, z: s3 + a3 }, { x: e4 + r3, y: i3, z: s3 + a3 }, { x: e4, y: i3, z: s3 + a3 }];
            f2 = c(f2, n2, t4.insidePlotArea);
            let u2 = (t5) => 0 === o2 && t5 > 1 && t5 < 6 ? { x: f2[t5].x, y: f2[t5].y + 10, z: f2[t5].z } : f2[0].x === f2[7].x && t5 >= 4 ? { x: f2[t5].x + 10, y: f2[t5].y, z: f2[t5].z } : 0 === a3 && t5 < 2 || t5 > 5 ? { x: f2[t5].x, y: f2[t5].y, z: f2[t5].z + 10 } : f2[t5], z2 = (t5) => f2[t5], b2 = (t5, e5, i4) => {
              let s4 = t5.map(z2), o3 = e5.map(z2), r4 = t5.map(u2), a4 = e5.map(u2), n3 = [[], -1];
              return 0 > d(s4) ? n3 = [s4, 0] : 0 > d(o3) ? n3 = [o3, 1] : i4 && (p2.push(i4), n3 = 0 > d(r4) ? [s4, 0] : 0 > d(a4) ? [o3, 1] : [s4, 0]), n3;
            }, g2 = (x2 = b2([3, 2, 1, 0], [7, 6, 5, 4], "front"))[0], m3 = x2[1], v2 = (x2 = b2([1, 6, 7, 0], [4, 5, 2, 3], "top"))[0], M2 = x2[1], S2 = (x2 = b2([1, 2, 5, 6], [0, 7, 4, 3], "side"))[0], A2 = x2[1];
            return 1 === A2 ? y2 += 1e6 * (n2.plotWidth - e4) : A2 || (y2 += 1e6 * e4), y2 += 10 * (!M2 || l2 >= 0 && l2 <= 180 || l2 < 360 && l2 > 357.5 ? n2.plotHeight - i3 : 10 + i3), 1 === m3 ? y2 += 100 * s3 : m3 || (y2 += 100 * (1e3 - s3)), { front: this.toLinePath(g2, true), top: this.toLinePath(v2, true), side: this.toLinePath(S2, true), zIndexes: { group: Math.round(y2) }, forcedSides: p2, isFront: m3, isTop: M2 };
          }
          function A(t4) {
            let e4 = this.g(), s3 = this.Element.prototype, o2 = ["x", "y", "r", "innerR", "start", "end", "depth"];
            function r3(t5) {
              let e5 = {}, i3 = false, s4;
              for (s4 in t5 = f(t5)) -1 !== o2.indexOf(s4) && (e5[s4] = t5[s4], delete t5[s4], i3 = true);
              return !!i3 && [e5, t5];
            }
            for (let i3 of ((t4 = f(t4)).alpha = (t4.alpha || 0) * p, t4.beta = (t4.beta || 0) * p, e4.top = this.path(), e4.side1 = this.path(), e4.side2 = this.path(), e4.inn = this.path(), e4.out = this.path(), e4.onAdd = function() {
              let t5 = e4.parentGroup, i4 = e4.attr("class");
              for (let s4 of (e4.top.add(e4), ["out", "inn", "side1", "side2"])) e4[s4].attr({ class: i4 + " highcharts-3d-side" }).add(t5);
            }, ["addClass", "removeClass"])) e4[i3] = function() {
              let t5 = arguments;
              for (let s4 of ["top", "out", "inn", "side1", "side2"]) e4[s4][i3].apply(e4[s4], t5);
            };
            for (let i3 of (e4.setPaths = function(t5) {
              let i4 = e4.renderer.arc3dPath(t5), s4 = 100 * i4.zTop;
              e4.attribs = t5, e4.top.attr({ d: i4.top, zIndex: i4.zTop }), e4.inn.attr({ d: i4.inn, zIndex: i4.zInn }), e4.out.attr({ d: i4.out, zIndex: i4.zOut }), e4.side1.attr({ d: i4.side1, zIndex: i4.zSide1 }), e4.side2.attr({ d: i4.side2, zIndex: i4.zSide2 }), e4.zIndex = s4, e4.attr({ zIndex: s4 }), t5.center && (e4.top.setRadialReference(t5.center), delete t5.center);
            }, e4.setPaths(t4), e4.fillSetter = function(t5) {
              let e5 = l(t5).brighten(-0.1).get();
              return this.fill = t5, this.side1.attr({ fill: e5 }), this.side2.attr({ fill: e5 }), this.inn.attr({ fill: e5 }), this.out.attr({ fill: e5 }), this.top.attr({ fill: t5 }), this;
            }, ["opacity", "translateX", "translateY", "visibility"])) e4[i3 + "Setter"] = function(t5, i4) {
              for (let s4 of (e4[i4] = t5, ["out", "inn", "side1", "side2", "top"])) e4[s4].attr(i4, t5);
            };
            return e4.attr = function(t5) {
              let i3, o3;
              return "object" == typeof t5 && (o3 = r3(t5)) && (i3 = o3[0], arguments[0] = o3[1], y(e4.attribs, i3), e4.setPaths(e4.attribs)), s3.attr.apply(e4, arguments);
            }, e4.animate = function(t5, o3, a3) {
              let l2, h2;
              let p2 = this.attribs, c2 = "data-" + Math.random().toString(26).substring(2, 9);
              delete t5.center, delete t5.z, delete t5.alpha, delete t5.beta;
              let d2 = n(u(o3, this.renderer.globalAnimation));
              return d2.duration && (l2 = r3(t5), e4[c2] = 0, t5[c2] = 1, e4[c2 + "Setter"] = i2.noop, l2 && (h2 = l2[0], d2.step = function(t6, e5) {
                let i3 = (t7) => p2[t7] + (u(h2[t7], p2[t7]) - p2[t7]) * e5.pos;
                e5.prop === c2 && e5.elem.setPaths(f(p2, { x: i3("x"), y: i3("y"), r: i3("r"), innerR: i3("innerR"), start: i3("start"), end: i3("end"), depth: i3("depth") }));
              }), o3 = d2), s3.animate.call(this, t5, o3, a3);
            }, e4.destroy = function() {
              return this.top.destroy(), this.out.destroy(), this.inn.destroy(), this.side1.destroy(), this.side2.destroy(), s3.destroy.call(this);
            }, e4.hide = function() {
              this.top.hide(), this.out.hide(), this.inn.hide(), this.side1.hide(), this.side2.hide();
            }, e4.show = function(t5) {
              this.top.show(t5), this.out.show(t5), this.inn.show(t5), this.side1.show(t5), this.side2.show(t5);
            }, e4;
          }
          function P(t4) {
            let e4 = t4.x || 0, i3 = t4.y || 0, s3 = t4.start || 0, o2 = (t4.end || 0) - 1e-5, r3 = t4.r || 0, a3 = t4.innerR || 0, n2 = t4.depth || 0, l2 = t4.alpha || 0, h2 = t4.beta || 0, p2 = Math.cos(s3), c2 = Math.sin(s3), d2 = Math.cos(o2), x2 = Math.sin(o2), y2 = r3 * Math.cos(h2), f2 = r3 * Math.cos(l2), u2 = a3 * Math.cos(h2), m3 = a3 * Math.cos(l2), M2 = n2 * Math.sin(h2), S2 = n2 * Math.sin(l2), A2 = [["M", e4 + y2 * p2, i3 + f2 * c2]];
            (A2 = A2.concat(v(e4, i3, y2, f2, s3, o2, 0, 0))).push(["L", e4 + u2 * d2, i3 + m3 * x2]), (A2 = A2.concat(v(e4, i3, u2, m3, o2, s3, 0, 0))).push(["Z"]);
            let P2 = h2 > 0 ? Math.PI / 2 : 0, D = l2 > 0 ? 0 : Math.PI / 2, C = s3 > -P2 ? s3 : o2 > -P2 ? -P2 : s3, j = o2 < g - D ? o2 : s3 < g - D ? g - D : o2, k = 2 * g - D, L = [["M", e4 + y2 * z(C), i3 + f2 * b(C)]];
            L = L.concat(v(e4, i3, y2, f2, C, j, 0, 0)), o2 > k && s3 < k ? (L.push(["L", e4 + y2 * z(j) + M2, i3 + f2 * b(j) + S2]), (L = L.concat(v(e4, i3, y2, f2, j, k, M2, S2))).push(["L", e4 + y2 * z(k), i3 + f2 * b(k)]), (L = L.concat(v(e4, i3, y2, f2, k, o2, 0, 0))).push(["L", e4 + y2 * z(o2) + M2, i3 + f2 * b(o2) + S2]), (L = L.concat(v(e4, i3, y2, f2, o2, k, M2, S2))).push(["L", e4 + y2 * z(k), i3 + f2 * b(k)]), L = L.concat(v(e4, i3, y2, f2, k, j, 0, 0))) : o2 > g - D && s3 < g - D && (L.push(["L", e4 + y2 * Math.cos(j) + M2, i3 + f2 * Math.sin(j) + S2]), (L = L.concat(v(e4, i3, y2, f2, j, o2, M2, S2))).push(["L", e4 + y2 * Math.cos(o2), i3 + f2 * Math.sin(o2)]), L = L.concat(v(e4, i3, y2, f2, o2, j, 0, 0))), L.push(["L", e4 + y2 * Math.cos(j) + M2, i3 + f2 * Math.sin(j) + S2]), (L = L.concat(v(e4, i3, y2, f2, j, C, M2, S2))).push(["Z"]);
            let I = [["M", e4 + u2 * p2, i3 + m3 * c2]];
            (I = I.concat(v(e4, i3, u2, m3, s3, o2, 0, 0))).push(["L", e4 + u2 * Math.cos(o2) + M2, i3 + m3 * Math.sin(o2) + S2]), (I = I.concat(v(e4, i3, u2, m3, o2, s3, M2, S2))).push(["Z"]);
            let w = [["M", e4 + y2 * p2, i3 + f2 * c2], ["L", e4 + y2 * p2 + M2, i3 + f2 * c2 + S2], ["L", e4 + u2 * p2 + M2, i3 + m3 * c2 + S2], ["L", e4 + u2 * p2, i3 + m3 * c2], ["Z"]], T = [["M", e4 + y2 * d2, i3 + f2 * x2], ["L", e4 + y2 * d2 + M2, i3 + f2 * x2 + S2], ["L", e4 + u2 * d2 + M2, i3 + m3 * x2 + S2], ["L", e4 + u2 * d2, i3 + m3 * x2], ["Z"]], X = Math.atan2(S2, -M2), G = Math.abs(o2 + X), Z = Math.abs(s3 + X), Y = Math.abs((s3 + o2) / 2 + X);
            function R(t5) {
              return (t5 %= 2 * Math.PI) > Math.PI && (t5 = 2 * Math.PI - t5), t5;
            }
            G = R(G), Z = R(Z);
            let E = 1e5 * (Y = R(Y)), F = 1e5 * Z, O = 1e5 * G;
            return { top: A2, zTop: 1e5 * Math.PI + 1, out: L, zOut: Math.max(E, F, O), inn: I, zInn: Math.max(E, F, O), side1: w, zSide1: 0.99 * O, side2: T, zSide2: 0.99 * F };
          }
          t3.compose = function(t4) {
            let i3 = t4.prototype;
            i3.element3d || y(i3, { Element3D: o, arc3d: A, arc3dPath: P, cuboid: M, cuboidPath: S, element3d: m2, face3d: r2, polyhedron: a2, toLinePath: e3, toLineSegments: s2 });
          };
        })(a || (a = {})), a;
      }), i(e, "Core/Axis/ZAxis.js", [e["Core/Axis/Axis.js"], e["Core/Defaults.js"], e["Core/Utilities.js"]], function(t2, e2, i2) {
        let { defaultOptions: s } = e2, { addEvent: o, merge: r, pick: a, splat: n } = i2;
        function l(t3) {
          return new p(this, t3);
        }
        function h() {
          let t3 = this.options.zAxis = n(this.options.zAxis || {});
          this.is3d() && (this.zAxis = [], t3.forEach((t4) => {
            this.addZAxis(t4).setScale();
          }));
        }
        class p extends t2 {
          constructor() {
            super(...arguments), this.isZAxis = true;
          }
          static compose(t3) {
            let e3 = t3.prototype;
            e3.addZAxis || (s.zAxis = r(s.xAxis, { offset: 0, lineWidth: 0 }), e3.addZAxis = l, e3.collectionsWithInit.zAxis = [e3.addZAxis], e3.collectionsWithUpdate.push("zAxis"), o(t3, "afterGetAxes", h));
          }
          init(t3, e3) {
            this.isZAxis = true, super.init(t3, e3, "zAxis");
          }
          getSeriesExtremes() {
            this.hasVisibleSeries = false, this.dataMin = this.dataMax = this.ignoreMinPadding = this.ignoreMaxPadding = void 0, this.stacking && this.stacking.buildStacks(), this.series.forEach((t3) => {
              if (t3.reserveSpace()) {
                let e3 = t3.options.threshold;
                this.hasVisibleSeries = true, this.positiveValuesOnly && e3 <= 0 && (e3 = void 0);
                let i3 = t3.zData;
                i3.length && (this.dataMin = Math.min(a(this.dataMin, i3[0]), Math.min.apply(null, i3)), this.dataMax = Math.max(a(this.dataMax, i3[0]), Math.max.apply(null, i3)));
              }
            });
          }
          setAxisSize() {
            let t3 = this.chart;
            super.setAxisSize(), this.width = this.len = t3.options.chart.options3d && t3.options.chart.options3d.depth || 0, this.right = t3.chartWidth - this.width - this.left;
          }
        }
        return p;
      }), i(e, "Series/Column3D/Column3DComposition.js", [e["Core/Globals.js"], e["Core/Math3D.js"], e["Core/Utilities.js"]], function(t2, e2, i2) {
        let { composed: s } = t2, { perspective: o } = e2, { addEvent: r, extend: a, pick: n, pushUnique: l, wrap: h } = i2;
        function p() {
          let t3 = this.chart, e3 = this.options, i3 = e3.depth, s2 = (e3.stacking ? e3.stack || 0 : this.index) * (i3 + (e3.groupZPadding || 1)), r2 = this.borderWidth % 2 ? 0.5 : 0, n2;
          for (let l2 of (t3.inverted && !this.yAxis.reversed && (r2 *= -1), false !== e3.grouping && (s2 = 0), s2 += e3.groupZPadding || 1, this.points)) if (l2.outside3dPlot = null, null !== l2.y) {
            let e4;
            let h2 = a({ x: 0, y: 0, width: 0, height: 0 }, l2.shapeArgs || {}), p2 = [["x", "width"], ["y", "height"]], c2 = l2.tooltipPos;
            for (let t4 of p2) if ((e4 = h2[t4[0]] - r2) < 0 && (h2[t4[1]] += h2[t4[0]] + r2, h2[t4[0]] = -r2, e4 = 0), e4 + h2[t4[1]] > this[t4[0] + "Axis"].len && 0 !== h2[t4[1]] && (h2[t4[1]] = this[t4[0] + "Axis"].len - h2[t4[0]]), 0 !== h2[t4[1]] && (h2[t4[0]] >= this[t4[0] + "Axis"].len || h2[t4[0]] + h2[t4[1]] <= r2)) {
              for (let t5 in h2) h2[t5] = "y" === t5 ? -9999 : 0;
              l2.outside3dPlot = true;
            }
            if ("roundedRect" === l2.shapeType && (l2.shapeType = "cuboid"), l2.shapeArgs = a(h2, { z: s2, depth: i3, insidePlotArea: true }), n2 = { x: h2.x + h2.width / 2, y: h2.y, z: s2 + i3 / 2 }, t3.inverted && (n2.x = h2.height, n2.y = l2.clientX || 0), l2.axisXpos = n2.x, l2.axisYpos = n2.y, l2.axisZpos = n2.z, l2.plot3d = o([n2], t3, true, false)[0], c2) {
              let e5 = o([{ x: c2[0], y: c2[1], z: s2 + i3 / 2 }], t3, true, false)[0];
              l2.tooltipPos = [e5.x, e5.y];
            }
          }
          this.z = s2;
        }
        function c() {
          if (this.chart.is3d()) {
            let t3 = this.options, e3 = t3.grouping, i3 = t3.stacking, s2 = this.yAxis.options.reversedStacks, o2 = 0;
            if (!(void 0 !== e3 && !e3)) {
              let e4;
              let r2 = (function(t4, e5) {
                let i4 = t4.series, s3 = { totalStacks: 0 }, o3, r3 = 1;
                return i4.forEach(function(t5) {
                  s3[o3 = n(t5.options.stack, e5 ? 0 : i4.length - 1 - t5.index)] ? s3[o3].series.push(t5) : (s3[o3] = { series: [t5], position: r3 }, r3++);
                }), s3.totalStacks = r3 + 1, s3;
              })(this.chart, i3), a2 = t3.stack || 0;
              for (e4 = 0; e4 < r2[a2].series.length && r2[a2].series[e4] !== this; e4++) ;
              o2 = 10 * (r2.totalStacks - r2[a2].position) + (s2 ? e4 : -e4), this.xAxis.reversed || (o2 = 10 * r2.totalStacks - o2);
            }
            t3.depth = t3.depth || 25, this.z = this.z || 0, t3.zIndex = o2;
          }
        }
        function d(t3, ...e3) {
          return this.series.chart.is3d() ? this.graphic && "g" !== this.graphic.element.nodeName : t3.apply(this, e3);
        }
        function x(t3) {
          if (this.chart.is3d()) {
            let t4 = arguments, e3 = t4[1], i3 = this.yAxis, s2 = this.yAxis.reversed;
            if (e3) for (let t5 of this.points) null === t5.y || (t5.height = t5.shapeArgs.height, t5.shapey = t5.shapeArgs.y, t5.shapeArgs.height = 1, s2 || (t5.stackY ? t5.shapeArgs.y = t5.plotY + i3.translate(t5.stackY) : t5.shapeArgs.y = t5.plotY + (t5.negative ? -t5.height : t5.height)));
            else {
              for (let t5 of this.points) null !== t5.y && (t5.shapeArgs.height = t5.height, t5.shapeArgs.y = t5.shapey, t5.graphic && t5.graphic[t5.outside3dPlot ? "attr" : "animate"](t5.shapeArgs, this.options.animation));
              this.drawDataLabels();
            }
          } else t3.apply(this, [].slice.call(arguments, 1));
        }
        function y(t3, e3, i3, s2, o2, r2) {
          return "dataLabelsGroup" !== e3 && "markerGroup" !== e3 && this.chart.is3d() && (this[e3] && delete this[e3], r2 && (this.chart.columnGroup || (this.chart.columnGroup = this.chart.renderer.g("columnGroup").add(r2)), this[e3] = this.chart.columnGroup, this.chart.columnGroup.attr(this.getPlotBox()), this[e3].survive = true, "group" === e3 && (arguments[3] = "visible"))), t3.apply(this, Array.prototype.slice.call(arguments, 1));
        }
        function f(t3) {
          let e3 = t3.apply(this, [].slice.call(arguments, 1));
          return this.chart.is3d && this.chart.is3d() && (e3.stroke = this.options.edgeColor || e3.fill, e3["stroke-width"] = n(this.options.edgeWidth, 1)), e3;
        }
        function u(t3, e3, i3) {
          let s2 = this.chart.is3d && this.chart.is3d();
          s2 && (this.options.inactiveOtherPoints = true), t3.call(this, e3, i3), s2 && (this.options.inactiveOtherPoints = false);
        }
        function z(t3, e3) {
          if (this.chart.is3d()) for (let t4 of this.points) t4.visible = t4.options.visible = e3 = void 0 === e3 ? !n(this.visible, t4.visible) : e3, this.options.data[this.data.indexOf(t4)] = t4.options, t4.graphic && t4.graphic.attr({ visibility: e3 ? "visible" : "hidden" });
          t3.apply(this, Array.prototype.slice.call(arguments, 1));
        }
        function b(t3) {
          t3.apply(this, [].slice.call(arguments, 1)), this.chart.is3d() && this.translate3dShapes();
        }
        function g(t3, e3, i3, s2, r2) {
          let a2 = this.chart;
          if (s2.outside3dPlot = e3.outside3dPlot, a2.is3d() && this.is("column")) {
            let t4 = this.options, i4 = n(s2.inside, !!this.options.stacking), l2 = a2.options.chart.options3d, h2 = e3.pointWidth / 2 || 0, p2 = { x: r2.x + h2, y: r2.y, z: this.z + t4.depth / 2 };
            a2.inverted && (i4 && (r2.width = 0, p2.x += e3.shapeArgs.height / 2), l2.alpha >= 90 && l2.alpha <= 270 && (p2.y += e3.shapeArgs.width)), p2 = o([p2], a2, true, false)[0], r2.x = p2.x - h2, r2.y = e3.outside3dPlot ? -9e9 : p2.y;
          }
          t3.apply(this, [].slice.call(arguments, 1));
        }
        function m(t3) {
          return !arguments[2].outside3dPlot && t3.apply(this, [].slice.call(arguments, 1));
        }
        function v(t3, e3) {
          let i3 = t3.apply(this, [].slice.call(arguments, 1)), s2 = this.axis.chart, { width: r2 } = e3;
          if (s2.is3d() && this.base) {
            let t4 = +this.base.split(",")[0], e4 = s2.series[t4], a2 = s2.options.chart.options3d;
            if (e4 && "column" === e4.type) {
              let t5 = { x: i3.x + (s2.inverted ? i3.height : r2 / 2), y: i3.y, z: e4.options.depth / 2 };
              s2.inverted && (i3.width = 0, a2.alpha >= 90 && a2.alpha <= 270 && (t5.y += r2)), t5 = o([t5], s2, true, false)[0], i3.x = t5.x - r2 / 2, i3.y = t5.y;
            }
          }
          return i3;
        }
        return { compose: function(t3, e3) {
          if (l(s, "Column3D")) {
            let i3 = t3.prototype, s2 = e3.prototype, { column: o2, columnRange: a2 } = t3.types;
            if (h(i3, "alignDataLabel", g), h(i3, "justifyDataLabel", m), h(s2, "getStackBox", v), o2) {
              let t4 = o2.prototype, e4 = t4.pointClass.prototype;
              t4.translate3dPoints = () => void 0, t4.translate3dShapes = p, r(t4, "afterInit", c), h(e4, "hasNewShapeType", d), h(t4, "animate", x), h(t4, "plotGroup", y), h(t4, "pointAttribs", f), h(t4, "setState", u), h(t4, "setVisible", z), h(t4, "translate", b);
            }
            if (a2) {
              let t4 = a2.prototype;
              h(t4.pointClass.prototype, "hasNewShapeType", d), h(t4, "plotGroup", y), h(t4, "pointAttribs", f), h(t4, "setState", u), h(t4, "setVisible", z);
            }
          }
        } };
      }), i(e, "Series/Pie3D/Pie3DPoint.js", [e["Core/Series/SeriesRegistry.js"]], function(t2) {
        let { pie: { prototype: { pointClass: e2 } } } = t2.seriesTypes;
        return class extends e2 {
          haloPath() {
            return this.series?.chart.is3d() ? [] : super.haloPath.apply(this, arguments);
          }
        };
      }), i(e, "Series/Pie3D/Pie3DSeries.js", [e["Core/Globals.js"], e["Series/Pie3D/Pie3DPoint.js"], e["Core/Series/SeriesRegistry.js"], e["Core/Utilities.js"]], function(t2, e2, i2, s) {
        let { composed: o, deg2rad: r } = t2, { pie: a } = i2.seriesTypes, { extend: n, pick: l, pushUnique: h } = s;
        class p extends a {
          static compose(t3) {
            h(o, "Pie3D") && (t3.types.pie = p);
          }
          addPoint() {
            super.addPoint.apply(this, arguments), this.chart.is3d() && this.update(this.userOptions, true);
          }
          animate(t3) {
            if (this.chart.is3d()) {
              let e3 = this.center, i3 = this.group, s2 = this.markerGroup, o2 = this.options.animation, r2;
              true === o2 && (o2 = {}), t3 ? (i3.oldtranslateX = l(i3.oldtranslateX, i3.translateX), i3.oldtranslateY = l(i3.oldtranslateY, i3.translateY), r2 = { translateX: e3[0], translateY: e3[1], scaleX: 1e-3, scaleY: 1e-3 }, i3.attr(r2), s2 && (s2.attrSetters = i3.attrSetters, s2.attr(r2))) : (r2 = { translateX: i3.oldtranslateX, translateY: i3.oldtranslateY, scaleX: 1, scaleY: 1 }, i3.animate(r2, o2), s2 && s2.animate(r2, o2));
            } else super.animate.apply(this, arguments);
          }
          getDataLabelPosition(t3, e3) {
            let i3 = super.getDataLabelPosition(t3, e3);
            if (this.chart.is3d()) {
              let e4 = this.chart.options.chart.options3d, s2 = t3.shapeArgs, o2 = s2.r, a2 = (s2.alpha || e4?.alpha) * r, n2 = (s2.beta || e4?.beta) * r, l2 = (s2.start + s2.end) / 2, h2 = i3.connectorPosition, p2 = -o2 * (1 - Math.cos(a2)) * Math.sin(l2), c = o2 * (Math.cos(n2) - 1) * Math.cos(l2);
              for (let t4 of [i3?.natural, h2.breakAt, h2.touchingSliceAt]) t4.x += c, t4.y += p2;
            }
            return i3;
          }
          pointAttribs(t3) {
            let e3 = super.pointAttribs.apply(this, arguments), i3 = this.options;
            return this.chart.is3d() && !this.chart.styledMode && (e3.stroke = i3.edgeColor || t3.color || this.color, e3["stroke-width"] = l(i3.edgeWidth, 1)), e3;
          }
          translate() {
            if (super.translate.apply(this, arguments), !this.chart.is3d()) return;
            let t3 = this.options, e3 = t3.depth || 0, i3 = this.chart.options.chart.options3d, s2 = i3.alpha, o2 = i3.beta, a2 = t3.stacking ? (t3.stack || 0) * e3 : this._i * e3;
            for (let i4 of (a2 += e3 / 2, false !== t3.grouping && (a2 = 0), this.points)) {
              let n2 = i4.shapeArgs;
              i4.shapeType = "arc3d", n2.z = a2, n2.depth = 0.75 * e3, n2.alpha = s2, n2.beta = o2, n2.center = this.center;
              let l2 = (n2.end + n2.start) / 2;
              i4.slicedTranslation = { translateX: Math.round(Math.cos(l2) * t3.slicedOffset * Math.cos(s2 * r)), translateY: Math.round(Math.sin(l2) * t3.slicedOffset * Math.cos(s2 * r)) };
            }
          }
          drawTracker() {
            if (super.drawTracker.apply(this, arguments), this.chart.is3d()) {
              for (let t3 of this.points) if (t3.graphic) for (let e3 of ["out", "inn", "side1", "side2"]) t3.graphic && (t3.graphic[e3].element.point = t3);
            }
          }
        }
        return n(p.prototype, { pointClass: e2 }), p;
      }), i(e, "Series/Scatter3D/Scatter3DPoint.js", [e["Series/Scatter/ScatterSeries.js"], e["Core/Utilities.js"]], function(t2, e2) {
        let { pointClass: i2 } = t2.prototype, { defined: s } = e2;
        return class extends i2 {
          applyOptions() {
            return super.applyOptions.apply(this, arguments), s(this.z) || (this.z = 0), this;
          }
        };
      }), i(e, "Series/Scatter3D/Scatter3DSeriesDefaults.js", [], function() {
        return { tooltip: { pointFormat: "x: <b>{point.x}</b><br/>y: <b>{point.y}</b><br/>z: <b>{point.z}</b><br/>" } };
      }), i(e, "Series/Scatter3D/Scatter3DSeries.js", [e["Core/Math3D.js"], e["Series/Scatter3D/Scatter3DPoint.js"], e["Series/Scatter3D/Scatter3DSeriesDefaults.js"], e["Series/Scatter/ScatterSeries.js"], e["Core/Series/SeriesRegistry.js"], e["Core/Utilities.js"]], function(t2, e2, i2, s, o, r) {
        let { pointCameraDistance: a } = t2, { extend: n, merge: l } = r;
        class h extends s {
          pointAttribs(t3) {
            let e3 = super.pointAttribs.apply(this, arguments);
            return this.chart.is3d() && t3 && (e3.zIndex = a(t3, this.chart)), e3;
          }
        }
        return h.defaultOptions = l(s.defaultOptions, i2), n(h.prototype, { axisTypes: ["xAxis", "yAxis", "zAxis"], directTouch: true, parallelArrays: ["x", "y", "z"], pointArrayMap: ["x", "y", "z"], pointClass: e2 }), o.registerSeriesType("scatter3d", h), h;
      }), i(e, "masters/highcharts-3d.src.js", [e["Core/Globals.js"], e["Core/Chart/Chart3D.js"], e["Series/Area3D/Area3DSeries.js"], e["Core/Axis/Axis3DComposition.js"], e["Core/Renderer/RendererRegistry.js"], e["Core/Series/Series3D.js"], e["Core/Axis/Stacking/StackItem.js"], e["Core/Renderer/SVG/SVGRenderer3D.js"], e["Core/Axis/ZAxis.js"], e["Series/Column3D/Column3DComposition.js"], e["Series/Pie3D/Pie3DSeries.js"]], function(t2, e2, i2, s, o, r, a, n, l, h, p) {
        return i2.compose(t2.seriesTypes.area), s.compose(t2.Axis, t2.Tick), e2.compose(t2.Chart, t2.Fx), h.compose(t2.Series, a), p.compose(t2.Series), r.compose(t2.Series), n.compose(o.getRendererType()), l.compose(t2.Chart), t2;
      });
    });
  }
});
export default require_highcharts_3d();
//# sourceMappingURL=highcharts_highcharts-3d.js.map
