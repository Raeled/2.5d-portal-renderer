var drawingSector = [];

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var camera = { x:50, y: 0};
var cursor = { x:0, y: 0};
var snapToGrid = true;
var gridSize = 10;
var cameraSpeed = 10;
var selectedSector = 0;
var view3d = false;

function drawEditor() {
    ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);

    var halfWidth = (ctx.canvas.width / 2) - camera.x;
    var halfHeight = (ctx.canvas.height / 2) - camera.y;

    var relativeCursor = { x: cursor.x + camera.x, y: cursor.y + camera.y };

    ctx.strokeStyle = "#ddd";
    ctx.beginPath();
    ctx.moveTo(halfWidth + relativeCursor.x,                 0);
    ctx.lineTo(halfWidth + relativeCursor.x, ctx.canvas.height);
    ctx.moveTo(               0, halfHeight + relativeCursor.y);
    ctx.lineTo(ctx.canvas.width, halfHeight + relativeCursor.y);
    ctx.stroke();


    for (var sectorId = 0; sectorId < sectors.length; sectorId++) {
        var sector = sectors[sectorId];

        ctx.strokeStyle = sectorId == selectedSector ? "#000" : "#666";
        ctx.beginPath();
        ctx.moveTo(halfWidth + sector.points[0].x, halfHeight + sector.points[0].y);
        for (var i =1; i<sector.points.length; i++) {
            ctx.lineTo(halfWidth + sector.points[i].x, halfHeight + sector.points[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        for (var i=0; i<sector.points.length; i++) {
            var p = sector.points[i];
            ctx.beginPath();
            ctx.moveTo(halfWidth + p.x-5, halfHeight + p.y-5);
            ctx.lineTo(halfWidth + p.x+5, halfHeight + p.y-5);
            ctx.lineTo(halfWidth + p.x+5, halfHeight + p.y+5);
            ctx.lineTo(halfWidth + p.x-5, halfHeight + p.y+5);
            ctx.closePath();
            ctx.stroke();
        }
    }

    if (drawingSector.length > 0) {
        ctx.strokeStyle = "#00f";
        ctx.beginPath();
        ctx.moveTo(halfWidth + drawingSector[0].x, halfHeight + drawingSector[0].y);
        for (i=1; i<drawingSector.length; i++) {
            ctx.lineTo(halfWidth + drawingSector[i].x, halfHeight + drawingSector[i].y);
        }

        ctx.lineTo(halfWidth + cursor.x + camera.x, halfHeight + cursor.y + camera.y) ;
        ctx.stroke();

        for (var i=0; i<drawingSector.length; i++) {
            var p = drawingSector[i];
            ctx.beginPath();
            ctx.moveTo(halfWidth + p.x-5, halfHeight + p.y-5);
            ctx.lineTo(halfWidth + p.x+5, halfHeight + p.y-5);
            ctx.lineTo(halfWidth + p.x+5, halfHeight + p.y+5);
            ctx.lineTo(halfWidth + p.x-5, halfHeight + p.y+5);
            ctx.closePath();
            ctx.stroke();
        }
    }
}

canvas.addEventListener('mousemove', function(event) {
    cursor = {
        x: (event.layerX - canvas.width / 2),
        y: (event.layerY - canvas.height / 2) };

    if (snapToGrid) {
        cursor.x = Math.round(cursor.x / gridSize) * gridSize;
        cursor.y = Math.round(cursor.y / gridSize) * gridSize;
    }

    if (!view3d) drawEditor();
});

function drawPoint(point) {
    var closed = false;
    if (drawingSector.length >= 3) {

        if ((Math.abs(point.x - drawingSector[0].x) < 10) &&
            (Math.abs(point.y - drawingSector[0].y) < 10)) {
            closed = true;
        }
    }

    if (closed) {
        sectors.push({bottom: -20, top: 20, points: drawingSector});
        drawingSector = [];
    } else
        drawingSector.push({x: point.x, y: point.y });
}

function deleteSector() {
    if (selectedSector >= 0) {
        sectors.splice(selectedSector, 1);
        selectedSector = -1;
    }
}

function activate3dMode(point) {
    for (var sectorId = 0; sectorId < sectors.length; sectorId++) {
        var sector = sectors[sectorId];

        if (inPolygon(point, sector.points)) {
            player.x = point.x;
            player.y = point.y;
            player.z = sector.bottom + 20;
            player.sector = sectorId;
            completeSectors();
            view3d = true;
            return;
        }
    }

    console.error("No sector found to put player in");
}

function toggleViewMode(point) {
    if (!view3d) {
        activate3dMode(point);
    }
    else { view3d = false; }
}

document.addEventListener('keydown', function(event) {
    var relativeCursor = { x: cursor.x + camera.x, y: cursor.y + camera.y };

    switch (event.keyCode) {
        case 32 /* space */: drawPoint(relativeCursor); break;
        case 27 /* esc */: drawingSector = []; break;
        case 85 /* u */: drawingSector.pop(); break;
        case 9 /* tab */: toggleViewMode(relativeCursor); break;
        case 88 /* x */: deleteSector(); break;
        default: console.log(event.keyCode); return;
    }

    event.preventDefault();
    if (!view3d) drawEditor();
});

canvas.addEventListener('click', function(event) {
    if (!view3d) {
        var relativeCursor = { x: cursor.x + camera.x, y: cursor.y + camera.y };
        var point = relativeCursor;
        var firstMatch = -1;
        var foundCurrent = false;

        for (var sectorId = 0; sectorId < sectors.length; sectorId++) {
            var sector = sectors[sectorId];

            if (inPolygon(point, sector.points)) {
                if (firstMatch == -1) firstMatch = sectorId;

                if (foundCurrent) {
                    firstMatch = sectorId;
                    break;
                }

                foundCurrent = foundCurrent || sectorId == selectedSector;
            }
        }

        selectedSector = firstMatch;

        drawEditor();
    }
});

drawEditor();

function mainLoop() {
    if (!view3d) {
        var moved = false;
        if (keyUp) { camera.y -= cameraSpeed; moved = true; }
        if (keyDown) { camera.y += cameraSpeed; moved = true; }
        if (keyLeft) { camera.x -= cameraSpeed; moved = true; }
        if (keyRight) { camera.x += cameraSpeed; moved = true; }

        if (moved) { drawEditor(); }
    } else {
        updatePlayer();

        var viewMatrix = mat4MulMat4(mat4Rotation(rads(-player.angle)),
                                     mat4Translation({x: -player.x, y: -player.y, z: 0}));

        var nearClip = 5.0;
        var ratio = ctx.canvas.width / ctx.canvas.height;

        var renderState = {
            context: ctx,
            viewMatrix: viewMatrix,
            nearClip: nearClip,
            projection: mat4Projection(rads(15), ratio, nearClip, 500.0),
        };

        drawSector3d(player.sector, -1, renderState, 0, ctx.canvas.width);
    }
}

console.log(localStorage);

window.setInterval(mainLoop, 1000/30);
