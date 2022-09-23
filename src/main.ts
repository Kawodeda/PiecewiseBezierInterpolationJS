class Point {
    constructor(
        public x: number, 
        public y: number) {

    }

    static sum(p1: Point, p2: Point) {
        var result = new Point(0, 0);
        result.add(p1);
        result.add(p2);

        return result;
    }

    add(other: Point) {
        this.x += other.x;
        this.y += other.y;
    }

    scale(scalar: number) {
        this.x *= scalar;
        this.y *= scalar;
    }
}

const convexHullInput = document.getElementById("convexHullInput") as HTMLInputElement;
const tangentSlider = document.getElementById("tangentSlider") as HTMLInputElement;
const simplifyButton = document.getElementById("simplifyButton") as HTMLInputElement;
const toleranceSlider = document.getElementById("toleranceSlider") as HTMLInputElement;
const shiftSlider = document.getElementById("shiftSlider") as HTMLInputElement;
const masterSlider = document.getElementById("masterSlider") as HTMLInputElement;
const pointsCheckbox = document.getElementById("pointsCheckbox") as HTMLInputElement;
const polylineCheckbox = document.getElementById("polylineCheckbox") as HTMLInputElement;
const originalCheckbox = document.getElementById("originalCheckbox") as HTMLInputElement;
const masterCheckbox = document.getElementById("masterCheckbox") as HTMLInputElement;
const masterOutput = document.getElementById("masterOutput") as HTMLOutputElement;
const toleranceOutput = document.getElementById("toleranceOutput") as HTMLOutputElement;
const shiftOutput = document.getElementById("shiftOutput") as HTMLOutputElement;
const tangentOutput = document.getElementById("tangentOutput") as HTMLOutputElement;

window.addEventListener("load", () => {
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
    masterCheckbox.addEventListener("input", onMasterCheckboxInput);

    onMasterChanged();
    reloadOutput();
    onShiftChanged(); 
    onToleranceChanged();    
    redraw();  
});

let mouseDrawing = false;
let polyline: Point[] = [];
let refinedPolyline: Point[] = [];

// polyline = [
//     new Point(340, 340),
//     new Point(400, 280),
//     new Point(320, 200)
// ];

function onMasterCheckboxInput(): void {
    masterSlider.disabled = !masterCheckbox.checked;

    if(! masterSlider.disabled) {
        onMasterChanged();
    }   
}

function onMasterChanged(): void {
    var master = getMaster();
    masterOutput.value = master.toString();
    tangentSlider.value = tangentToSliderValue(masterToTangent(master));
    reloadOutput();
    toleranceSlider.value = toleranceToSliderValue(masterToTolerance(master));
    onToleranceChanged();
}

// if(master <= 0.1) {
//     return master * 2.499 + 0.001;
// }
// else if(master > 0.1 && master < 0.65) {
//     return 0.25;
// } 
// else {
//     return master * (1 / 7) + (11 / 70);
// }
function masterToTangent(master: number): number {
    if(master <= 0.1) {
        return 0.001;
    }
    else if(master > 0.1 && master <= 0.5) {
        return master * 0.6225 - 0.06125;
    }
    else if(master > 0.5 && master <= 0.75){
        return 0.25;
    } 
    else {
        return master * 0.28 + 0.04;
    }
}

// master * 0.56 - 0.01;
// master * 1.44 - 0.01;
function masterToTolerance(master: number): number {
    if(master <= 0.25) {
        return 0.03 * Math.pow(27896.8, master) - 0.04;
    }
    else if(master > 0.25 && master <= 0.55) {
        return 0.35;
    }
    else {
        return master * (4 / 9) + (19 / 180);
    }
}

// function masterToNormalShift(master: number): number {
    
// }

function onSimplifyClick(): void {
    refinedPolyline = simplify(polyline, getTolerance());
    redraw();
}

function simplify(polyline: Point[], tolerance: number): Point[] {
    return simplifyParallelSegments(polyline, tolerance);
}

function onToleranceChanged() {
    toleranceOutput.value = getTolerance().toString();
    onSimplifyClick();
}

function onShiftChanged(): void {
    shiftOutput.value = getShift().toString();
    redraw();
}

function getMaster(): number {
    return parseFloat(masterSlider.value) / 100;
}

function getTangent(): number {
    return parseFloat(tangentSlider.value) / 1000; 
}

function getShift(): number {
    return parseFloat(shiftSlider.value) - parseFloat(shiftSlider.max) / 2;
}

function getTolerance(): number {
    return parseFloat(toleranceSlider.value) / 100;
}

function tangentToSliderValue(tangent: number): string {
    return (tangent * 1000).toString();
}

function toleranceToSliderValue(tolerance: number): string {
    return (tolerance * 100).toString();
}

function startMouseDraw(event: MouseEvent): void {
    if(! checkMouseOnCanvas(event)) {
        return;
    }

    mouseDrawing = true;
    polyline.push(getMousePosition(event));
    onSimplifyClick();
    redraw();
}

function stopMouseDraw(event: MouseEvent) {
    mouseDrawing = false;
}

function mouseDraw(event: MouseEvent) {
    if(! (mouseDrawing && checkMouseOnCanvas(event))) {
        return;
    }

    polyline.push(getMousePosition(event));
    onSimplifyClick();
    redraw();
}

function onTangentSliderInput(): void {
    reloadOutput();
    redraw();
}

function onDrawConvexHullInput(): void {
    redraw();
}

function checkMouseOnCanvas(mouseEvent: MouseEvent): boolean {
    const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
    return mouseEvent.clientX >= canvas.offsetLeft 
        && mouseEvent.clientX <= canvas.offsetLeft + canvas.width
        && mouseEvent.clientY >= canvas.offsetTop
        && mouseEvent.clientY <= canvas.offsetTop + canvas.height;
}

function getMousePosition(mouseEvent: MouseEvent): Point {
    const canvas = document.getElementById("mainCanvas");
    let mouseX = mouseEvent.clientX - canvas.offsetLeft;
    let mouseY = mouseEvent.clientY - canvas.offsetTop;
    return new Point(mouseX, mouseY);
}

function redraw(): void {
    const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    const tangent = getTangent();
    const tangentNormalShift = getShift();
    const showConvexHull = convexHullInput.checked;
    const showPoints = pointsCheckbox.checked;
    const showPolyline = polylineCheckbox.checked;
    const showOriginal = originalCheckbox.checked;
    
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

    if(showConvexHull) {

        context.strokeStyle = "greenYellow";
        context.fillStyle = "green";
        drawPolyline(context, sections.flat());
    }

    context.strokeStyle = "blue";
    for(let section of sections) {
        drawBezier(context, section[0], section[1], section[2], section[3]);
    }
}

function reloadOutput(): void {
    tangentOutput.value = getTangent().toString();
}

function getBezierPath(points: Point[], t: number, normalShift: number = 0): Point[][] {
    var sections: Point[][] = [];

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

function bezierControlPoints(p1: Point, p2: Point, p3: Point, p4: Point, t: number, shift: number = 0): Point[] {
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

function normalVector(p1: Point, p2: Point): Point {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;

    return normalize(new Point(-dy, dx));
}

function normalize(point: Point): Point {
    var d = distance(new Point(0, 0), point);

    return new Point(point.x / d, point.y / d);
}

function drawPoint(context: CanvasRenderingContext2D, point: Point, size: number): void {
    context.fillRect(point.x - size / 2, point.y - size / 2, size, size);
}

function drawPolyline(context: CanvasRenderingContext2D, polyline: Point[], drawPoints: boolean = true): void {
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

function drawQuadraticBezier(context: CanvasRenderingContext2D, p1: Point, p2: Point, p3: Point): void {
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.quadraticCurveTo(p2.x, p2.y, p3.x, p3.y);
    context.stroke();
}

function drawBezier(context: CanvasRenderingContext2D, p1: Point, p2: Point, p3: Point, p4: Point): void {
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.bezierCurveTo(p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);
    context.stroke();
}

function simplifyParallelSegments(polyline: Point[], tolerance: number): Point[] {
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

function formSingleLine(p1: Point, p2: Point, p3: Point, tolerance: number): boolean {
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

function absMax(value: number, min: number): number {
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

function distance(p1: Point, p2: Point): number {
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function cloneArray<T>(array: Array<T>): Array<T> {
    let result = [];
    for(let element of array) {
        result.push(element);
    }

    return result;
}
