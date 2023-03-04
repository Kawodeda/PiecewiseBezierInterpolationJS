var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Object.defineProperty(Point.prototype, "magnitude", {
        get: function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        },
        enumerable: false,
        configurable: true
    });
    Point.sum = function (p1, p2) {
        var result = new Point(0, 0);
        result.add(p1);
        result.add(p2);
        return result;
    };
    Point.prototype.negate = function () {
        return new Point(-this.x, -this.y);
    };
    Point.prototype.add = function (other) {
        this.x += other.x;
        this.y += other.y;
    };
    Point.prototype.scale = function (scalar) {
        this.x *= scalar;
        this.y *= scalar;
    };
    return Point;
}());
var convexHullInput = document.getElementById("convexHullInput");
var tangentSlider = document.getElementById("tangentSlider");
var simplifyButton = document.getElementById("simplifyButton");
var toleranceSlider = document.getElementById("toleranceSlider");
var shiftSlider = document.getElementById("shiftSlider");
var masterSlider = document.getElementById("masterSlider");
var pointsCheckbox = document.getElementById("pointsCheckbox");
var polylineCheckbox = document.getElementById("polylineCheckbox");
var originalCheckbox = document.getElementById("originalCheckbox");
var masterCheckbox = document.getElementById("masterCheckbox");
var curveChechbox = document.getElementById("curveCheckbox");
var masterOutput = document.getElementById("masterOutput");
var toleranceOutput = document.getElementById("toleranceOutput");
var shiftOutput = document.getElementById("shiftOutput");
var tangentOutput = document.getElementById("tangentOutput");
window.addEventListener("load", function () {
    document.addEventListener("mousedown", startMouseDraw);
    document.addEventListener("mouseup", stopMouseDraw);
    document.addEventListener("mousemove", mouseDraw);
    convexHullInput.addEventListener("input", onDrawConvexHullInput);
    tangentSlider.addEventListener("input", onTangentSliderInput);
    simplifyButton.addEventListener("click", onSimplifyClick);
    toleranceSlider.addEventListener("input", onToleranceChanged);
    shiftSlider.addEventListener("input", onShiftChanged);
    masterSlider.addEventListener("input", onMasterChanged);
    pointsCheckbox.addEventListener("input", redraw);
    polylineCheckbox.addEventListener("input", redraw);
    originalCheckbox.addEventListener("input", redraw);
    curveChechbox.addEventListener("input", redraw);
    masterCheckbox.addEventListener("input", onMasterCheckboxInput);
    onMasterChanged();
    reloadOutput();
    onShiftChanged();
    onToleranceChanged();
    redraw();
});
var mouseDrawing = false;
var polyline = [];
var refinedPolyline = [];
function onMasterCheckboxInput() {
    masterSlider.disabled = !masterCheckbox.checked;
    if (!masterSlider.disabled) {
        onMasterChanged();
    }
}
function onMasterChanged() {
    var master = getMaster();
    masterOutput.value = master.toString();
    tangentSlider.value = tangentToSliderValue(masterToTangent(master));
    reloadOutput();
    toleranceSlider.value = toleranceToSliderValue(masterToTolerance(master));
    onToleranceChanged();
}
function masterToTangent(master) {
    if (master <= 0.3) {
        return 0.001;
    }
    else if (master > 0.3 && master <= 0.6) {
        return master * (199 / 300) - 0.198;
    }
    else if (master > 0.6 && master <= 0.8) {
        return master * 0.25 + 0.05;
    }
    else {
        return 0.25;
    }
}
function masterToTolerance(master) {
    if (master <= 0.4) {
        return master * 0.65 - 0.01;
    }
    else if (master > 0.4 && master <= 0.6) {
        return master * 0.25 + 0.15;
    }
    else if (master > 0.6 && master <= 0.8) {
        return 0.3;
    }
    else {
        return master * 2 - 1.3;
    }
}
function onSimplifyClick() {
    refinedPolyline = simplify(polyline, getTolerance());
    redraw();
}
function simplify(polyline, tolerance) {
    return simplifyParallelSegments(polyline, tolerance);
}
function onToleranceChanged() {
    toleranceOutput.value = getTolerance().toString();
    onSimplifyClick();
}
function onShiftChanged() {
    shiftOutput.value = getShift().toString();
    redraw();
}
function getMaster() {
    return parseFloat(masterSlider.value) / 100;
}
function getTangent() {
    return parseFloat(tangentSlider.value) / 1000;
}
function getShift() {
    return parseFloat(shiftSlider.value) - parseFloat(shiftSlider.max) / 2;
}
function getTolerance() {
    return parseFloat(toleranceSlider.value) / 100;
}
function tangentToSliderValue(tangent) {
    return (tangent * 1000).toString();
}
function toleranceToSliderValue(tolerance) {
    return (tolerance * 100).toString();
}
function startMouseDraw(event) {
    if (!checkMouseOnCanvas(event)) {
        return;
    }
    mouseDrawing = true;
    polyline.push(getMousePosition(event));
    onSimplifyClick();
    redraw();
}
function stopMouseDraw(event) {
    mouseDrawing = false;
}
function mouseDraw(event) {
    if (!(mouseDrawing && checkMouseOnCanvas(event))) {
        return;
    }
    polyline.push(getMousePosition(event));
    onSimplifyClick();
    redraw();
}
function onTangentSliderInput() {
    reloadOutput();
    redraw();
}
function onDrawConvexHullInput() {
    redraw();
}
function checkMouseOnCanvas(mouseEvent) {
    var canvas = document.getElementById("mainCanvas");
    return mouseEvent.clientX >= canvas.offsetLeft
        && mouseEvent.clientX <= canvas.offsetLeft + canvas.width
        && mouseEvent.clientY >= canvas.offsetTop
        && mouseEvent.clientY <= canvas.offsetTop + canvas.height;
}
function getMousePosition(mouseEvent) {
    var canvas = document.getElementById("mainCanvas");
    var mouseX = mouseEvent.clientX - canvas.offsetLeft;
    var mouseY = mouseEvent.clientY - canvas.offsetTop;
    return new Point(mouseX, mouseY);
}
function redraw() {
    var canvas = document.getElementById("mainCanvas");
    var context = canvas.getContext("2d");
    var tangent = getTangent();
    var tangentNormalShift = getShift();
    var showConvexHull = convexHullInput.checked;
    var showPoints = pointsCheckbox.checked;
    var showPolyline = polylineCheckbox.checked;
    var showOriginal = originalCheckbox.checked;
    var showCurve = curveChechbox.checked;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgb(200, 200, 200)";
    context.fillStyle = "rgb(200, 200, 200)";
    context.setLineDash([5, 10]);
    if (showOriginal) {
        drawPolyline(context, polyline, false);
    }
    context.strokeStyle = "red";
    context.fillStyle = "red";
    if (showPolyline) {
        drawPolyline(context, refinedPolyline, false);
    }
    if (showPoints) {
        for (var _i = 0, refinedPolyline_1 = refinedPolyline; _i < refinedPolyline_1.length; _i++) {
            var point = refinedPolyline_1[_i];
            drawPoint(context, point, 2);
        }
    }
    context.setLineDash([]);
    var sections = getBezierPath(refinedPolyline, tangent, tangentNormalShift);
    if (showConvexHull) {
        context.strokeStyle = "greenYellow";
        context.fillStyle = "green";
        drawPolyline(context, sections.flat());
    }
    if (showCurve) {
        for (var _a = 0, sections_1 = sections; _a < sections_1.length; _a++) {
            var section = sections_1[_a];
            //context.strokeStyle = `rgb(${0}, ${Math.random() * 255}, ${Math.random() * 255})`;
            context.strokeStyle = "blue";
            drawBezier(context, section[0], section[1], section[2], section[3]);
        }
    }
}
function reloadOutput() {
    tangentOutput.value = getTangent().toString();
}
function getBezierPath(points, t, normalShift) {
    if (normalShift === void 0) { normalShift = 0; }
    var sections = [];
    sections[0] = bezierControlPoints(points[points.length - 1], points[0], points[1], points[2], t, normalShift);
    for (var i = 1; i < points.length - 2; i++) {
        sections[i] = bezierControlPoints(points[i - 1], points[i], points[i + 1], points[i + 2], t, normalShift);
    }
    sections[points.length - 2] = bezierControlPoints(points[points.length - 3], points[points.length - 2], points[points.length - 1], points[0], t, normalShift);
    sections[points.length - 1] = bezierControlPoints(points[points.length - 2], points[points.length - 1], points[0], points[1], t, normalShift);
    return sections;
}
function bezierControlPoints(p1, p2, p3, p4, t, shift) {
    if (shift === void 0) { shift = 0; }
    var dx1 = p1.x - p3.x;
    var dy1 = p1.y - p3.y;
    var d12 = distance(p1, p2);
    var d23 = distance(p2, p3);
    var x1 = p2.x - dx1 * t * Math.min(d23 / d12, 1);
    var y1 = p2.y - dy1 * t * Math.min(d23 / d12, 1);
    var cp1 = new Point(x1, y1);
    var dx2 = p2.x - p4.x;
    var dy2 = p2.y - p4.y;
    var d34 = distance(p3, p4);
    var x2 = p3.x + dx2 * t * Math.min(d23 / d34, 1);
    var y2 = p3.y + dy2 * t * Math.min(d23 / d34, 1);
    var cp2 = new Point(x2, y2);
    var normalShift1 = normalVector(cp1, p2);
    normalShift1.scale(shift);
    var start = Point.sum(p2, normalShift1);
    cp1.add(normalShift1);
    var normalShift2 = normalVector(p3, cp2);
    normalShift2.scale(shift);
    var end = Point.sum(p3, normalShift2);
    cp2.add(normalShift2);
    var result = [];
    result.push(start, cp1, cp2, end);
    return result;
}
function normalVector(p1, p2) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    return normalize(new Point(-dy, dx));
}
function normalize(point) {
    var d = distance(new Point(0, 0), point);
    return new Point(point.x / d, point.y / d);
}
function drawPoint(context, point, size) {
    context.fillRect(point.x - size / 2, point.y - size / 2, size, size);
}
function drawPolyline(context, polyline, drawPoints) {
    if (drawPoints === void 0) { drawPoints = true; }
    var pointSize = 4;
    context.beginPath();
    context.moveTo(polyline[0].x, polyline[0].y);
    for (var i = 1; i < polyline.length; i++) {
        context.lineTo(polyline[i].x, polyline[i].y);
        context.stroke();
    }
    context.lineTo(polyline[0].x, polyline[0].y);
    context.stroke();
    if (drawPoints) {
        for (var _i = 0, polyline_1 = polyline; _i < polyline_1.length; _i++) {
            var point = polyline_1[_i];
            drawPoint(context, point, pointSize);
        }
    }
}
function drawQuadraticBezier(context, p1, p2, p3) {
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.quadraticCurveTo(p2.x, p2.y, p3.x, p3.y);
    context.stroke();
}
function drawBezier(context, p1, p2, p3, p4) {
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.bezierCurveTo(p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);
    context.stroke();
}
function simplifyParallelSegments(polyline, tolerance) {
    var result = cloneArray(polyline);
    var count = 0;
    var iterations = 0;
    var removed = false;
    do {
        removed = false;
        if (formSingleLine(result[result.length - 1], result[0], result[1], tolerance)) {
            result.splice(0, 1);
            count++;
            removed = true;
        }
        for (var i = 0; i < result.length - 2; i++) {
            if (formSingleLine(result[i], result[i + 1], result[i + 2], tolerance)) {
                result.splice(i + 1, 1);
                count++;
                removed = true;
            }
        }
        if (formSingleLine(result[result.length - 2], result[result.length - 1], result[0], tolerance)) {
            result.splice(result.length - 1, 1);
            count++;
            removed = true;
        }
        iterations++;
    } while (removed);
    console.log("deleted ".concat(count, " points in ").concat(iterations, " iterations"));
    console.log("".concat(polyline.length - count, " remain\n").concat(removed));
    return result;
}
function formSingleLine(p1, p2, p3, tolerance) {
    var minValue = 1e-20;
    var tooCloseDistance = 20;
    var d1 = absMax(distance(p1, p2), minValue);
    var d2 = absMax(distance(p2, p3), minValue);
    var v1 = Point.sum(p1, p2.negate());
    var v2 = Point.sum(p2, p3.negate());
    var diff = angle(v1, v2);
    var factor = 1.5;
    if (Math.min(d1, d2) <= tooCloseDistance) {
        tolerance *= factor * tooCloseDistance / Math.min(d1, d2);
    }
    return diff <= tolerance;
}
function absMax(value, min) {
    if (Math.abs(value) < min) {
        if (value >= 0) {
            return min;
        }
        else {
            return -min;
        }
    }
    return value;
}
function distance(p1, p2) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}
function angle(p1, p2) {
    return Math.acos(dotProduct(p1, p2) / (p1.magnitude * p2.magnitude));
}
function dotProduct(p1, p2) {
    return p1.x * p2.x + p1.y * p2.y;
}
function cloneArray(array) {
    var result = [];
    for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
        var element = array_1[_i];
        result.push(element);
    }
    return result;
}
//# sourceMappingURL=main.js.map