class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static sum(p1, p2) {
        var result = new Point(0, 0);
        result.add(p1);
        result.add(p2);

        return result;
    }

    add(other) {
        this.x += other.x;
        this.y += other.y;
    }

    scale(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    }
}

window.addEventListener("load", () => {
    document.getElementById("covexHullInput").addEventListener("input", onDrawConvexHullInput);
    document.getElementById("tangentSlider").addEventListener("input", onSliderInput);
    document.addEventListener("mousedown", startMouseDraw);
    document.addEventListener("mouseup", stopMouseDraw);
    document.addEventListener("mousemove", mouseDraw);
    document.getElementById("simplifyButton").addEventListener("click", onSimplifyClick);
    document.getElementById("toleranceSlider").addEventListener("input", onToleranceChanged);
    document.getElementById("shiftSlider").addEventListener("input", onShiftChanged);
    document.getElementById("masterSlider").addEventListener("input", onMasterChanged);
    document.getElementById("pointsCheckbox").addEventListener("input", redraw);
    document.getElementById("polylineCheckbox").addEventListener("input", redraw);
    document.getElementById("originalCheckbox").addEventListener("input", redraw);
    document.getElementById("masterCheckbox").addEventListener("input", onMasterCheckboxInput);

    onMasterChanged();
    reloadOutput();
    onShiftChanged(); 
    onToleranceChanged();    
    redraw(polyline);  
});

let mouseDrawing = false;
let polyline = [];
let refinedPolyline = [];

// polyline = [
//     new Point(340, 340),
//     new Point(400, 280),
//     new Point(320, 200)
// ];

function onMasterCheckboxInput() {
    const masterCheckbox = document.getElementById("masterCheckbox");
    const masterSlider = document.getElementById("masterSlider");

    masterSlider.disabled = !masterCheckbox.checked;
}

function onMasterChanged() {
    const output = document.getElementById("masterOutput");
    var master = getMaster();
    output.value = master;
    
}

function masterToTangent(master) {
    return master * 0.24 + 0.01;
}

function masterToTolerance(master) {
    
}

function masterToNormalShift(master) {
    
}

function onSimplifyClick() {
    refinedPolyline = simplify(polyline, getTolerance());
    redraw();
}

function simplify(polyline, tolerance) {
    return simplifyParallelSegments(polyline, tolerance);
}

function getTolerance() {
    const slider = document.getElementById("toleranceSlider");

    return slider.value / 100;
}

function onToleranceChanged() {
    const output = document.getElementById("toleranceOutput");
    output.value = getTolerance();
    onSimplifyClick();
}

function getShift() {
    const slider = document.getElementById("shiftSlider");

    return slider.value - slider.max / 2;
}

function onShiftChanged() {
    const output = document.getElementById("shiftOutput");
    output.value = getShift();
    redraw();
}

function getMaster() {
    const slider = document.getElementById("masterSlider");

    return slider.value / 100;
}

function startMouseDraw(event) {
    if(! checkMouseOnCanvas(event)) {
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
    if(! (mouseDrawing && checkMouseOnCanvas(event))) {
        return;
    }

    polyline.push(getMousePosition(event));
    onSimplifyClick();
    redraw();
}

function onSliderInput() {
    reloadOutput();
    redraw();
}

function onDrawConvexHullInput() {
    redraw();
}

function sliderValueToTangent() {
    const slider = document.getElementById("tangentSlider");

    return slider.value / 1000; 
}

function checkMouseOnCanvas(mouseEvent) {
    const canvas = document.getElementById("mainCanvas");
    return mouseEvent.clientX >= canvas.offsetLeft 
        && mouseEvent.clientX <= canvas.offsetLeft + canvas.width
        && mouseEvent.clientY >= canvas.offsetTop
        && mouseEvent.clientY <= canvas.offsetTop + canvas.height;
}

function getMousePosition(mouseEvent) {
    const canvas = document.getElementById("mainCanvas");
    let mouseX = mouseEvent.clientX - canvas.offsetLeft;
    let mouseY = mouseEvent.clientY - canvas.offsetTop;
    return new Point(mouseX, mouseY);
}

function redraw() {
    const canvas = document.getElementById("mainCanvas");
    const context = canvas.getContext("2d");
    const tangent = sliderValueToTangent();
    const tangentNormalShift = getShift();
    const showPoints = document.getElementById("pointsCheckbox").checked;
    const showPolyline = document.getElementById("polylineCheckbox").checked;
    const showOriginal = document.getElementById("originalCheckbox").checked;
    
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "rgb(200, 200, 200)";
    context.fillStyle = "rgb(200, 200, 200)";
    context.setLineDash([5, 10]);    
    if(showOriginal) {
        drawPolyline(context, polyline, false);
    }

    context.strokeStyle = "red";
    context.fillStyle = "red";
    if(showPolyline) {
        drawPolyline(context, refinedPolyline, false);
    }
    if(showPoints) {
        for(let point of refinedPolyline) {
            drawPoint(context, point, 4);
        }
    }
    context.setLineDash([]);
    
    var sections = getBezierPath(refinedPolyline, tangent, tangentNormalShift);

    const convexHullInput = document.getElementById("covexHullInput");
    if(convexHullInput.checked) {

        context.strokeStyle = "greenYellow";
        context.fillStyle = "green";
        drawPolyline(context, sections.flat());
    }

    context.strokeStyle = "blue";
    for(let section of sections) {
        drawBezier(context, section[0], section[1], section[2], section[3]);
    }
}

function reloadOutput() {
    const output = document.getElementById("tangentOutput");
    output.value = sliderValueToTangent();
}

function getBezierPath(points, t, normalShift = 0) {
    var sections = [];

    sections[0] = bezierControlPoints(points[points.length - 1], points[0], points[1], points[2], t, normalShift);
    for(let i = 1; i < points.length - 2; i++) {
        sections[i] = bezierControlPoints(points[i - 1], points[i], points[i + 1], points[i + 2], t, normalShift);
    }
    sections[points.length - 2] = bezierControlPoints(
        points[points.length - 3], 
        points[points.length - 2], 
        points[points.length - 1], 
        points[0], t, normalShift);
    sections[points.length - 1] = bezierControlPoints(points[points.length - 2], points[points.length - 1], points[0], points[1], t, normalShift);

    return sections;
}

function bezierControlPoints(p1, p2, p3, p4, t, shift = 0) {
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

function drawPolyline(context, polyline, drawPoints = true) {
    const pointSize = 4;

    context.beginPath();
    
    drawPoint(context, polyline[0], pointSize);

    context.moveTo(polyline[0].x, polyline[0].y);
    for(var i = 1; i < polyline.length; i++) {
        context.lineTo(polyline[i].x, polyline[i].y);
        context.stroke();
        if(drawPoints) {
            drawPoint(context, polyline[i], pointSize);
        }        
    } 
    context.lineTo(polyline[0].x, polyline[0].y);
    context.stroke();
}

function drawConvexHull(context, polyline, controlPoints) {
    var points = controlPoints.flatMap(x => [x[0], x[1]]);

    var hullPolyline = [];
    for(let i = 0; i < controlPoints.length - 1; i++) {
        hullPolyline.push(polyline[i], controlPoints[i][0], controlPoints[i + 1][1]);
    }
    hullPolyline.push(
        polyline[polyline.length - 1], 
        controlPoints[controlPoints.length - 1][0], 
        controlPoints[0][1],
        polyline[0]);

    context.save();
    context.strokeStyle = "greenYellow";
    context.fillStyle = "green";
    context.beginPath();
    context.moveTo(hullPolyline[0].x, hullPolyline[0].y);
    for(let i = 1; i < hullPolyline.length; i++) {
        context.lineTo(hullPolyline[i].x, hullPolyline[i].y);
        context.stroke();
    }
    for(let point of points) {
        drawPoint(context, point, 4);
    }
    context.restore();
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
    let result = cloneArray(polyline);
    let count = 0;
    
    let iterations = 0;
    let removed = false;
    do {
        removed = false;
        if(formSingleLine(result[result.length - 1], result[0], result[1], tolerance)) {
            result.splice(0, 1);
            count++;
            removed = true;
        }
        for (let i = 0; i < result.length - 2; i++) {
            if (formSingleLine(result[i], result[i + 1], result[i + 2], tolerance)) {
                result.splice(i + 1, 1);
                count++;
                removed = true;
            }
        }
        if(formSingleLine(result[result.length - 2], result[result.length - 1], result[0], tolerance)) {
            result.splice(result.length - 1, 1);
            count++;
            removed = true;
        }
        iterations++;
    } while(removed)

    console.log(`deleted ${count} points in ${iterations} iterations`);
    console.log(`${polyline.length - count} remain\n${removed}`);

    return result;
}

function formSingleLine(p1, p2, p3, tolerance) {
    const minValue = 1e-20;
    const tooCloseDistance = 20;

    let dy1 = absMax(p2.y - p1.y, minValue);
    let dy2 = absMax(p3.y - p2.y, minValue);

    let d1 = absMax(distance(p1, p2), minValue);
    let d2 = absMax(distance(p2, p3), minValue);
    let sin1 = dy1 / d1;
    let sin2 = dy2 / d2;

    let a1 = Math.asin(sin1);
    let a2 = Math.asin(sin2);

    let diff = Math.abs(a1 - a2);
    //console.log(a1, a2, diff);

    const factor = 1.5;
    if (Math.min(d1, d2) <= tooCloseDistance) {
        tolerance *= factor * tooCloseDistance / Math.min(d1, d2);
    }
    
    return diff <= tolerance;
}

function absMax(value, min) {
    if(Math.abs(value) < min) {
        if(value >= 0) {
            return min;
        }
        else {
            return -min;
        }
    }

    return value;
}

function distance(p1, p2) {
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function cloneArray(array) {
    let result = [];
    for(let element of array) {
        result.push(element);
    }

    return result;
}
