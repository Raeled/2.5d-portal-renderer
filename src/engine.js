var keyLeft = false; var keyRight = false; var keyUp = false; var keyDown = false; var shiftPressed = false; var mapShown = false;
var player = {x: 0, y: 0, z: -20, angle: 0, sector: 0};
var sectors = [
    {bottom: -40, top: 80, floorColor: "#0f0", ceilingColor: "#0ff", points: [{x:-100, y: -100}, {x:   0, y: -140}, {x: 100, y: -100}, {x: 100, y:    0}, {x: 100, y: 100}, {x:-100, y:100}]},
    {bottom: -30, top: 80, floorColor: "#f00", ceilingColor: "#0ff", points: [{x:   0, y: -200}, {x: 100, y: -200}, {x: 100, y: -100}, {x:   0, y: -140}]},
    {bottom: -20, top: 80, floorColor: "#f00", ceilingColor: "#0ff", points: [{x:   0, y: -220}, {x: 100, y: -220}, {x: 100, y: -200}, {x:   0, y: -200}]},
    {bottom: -10, top: 80, floorColor: "#f00", ceilingColor: "#0ff", points: [{x:   0, y: -240}, {x: 100, y: -240}, {x: 100, y: -220}, {x:   0, y: -220}]},
    {bottom:   0, top: 80, floorColor: "#f00", ceilingColor: "#0ff", points: [{x:   0, y: -260}, {x: 100, y: -260}, {x: 100, y: -240}, {x:   0, y: -240}]},
    {bottom:  10, top: 80, floorColor: "#00f", ceilingColor: "#0ff", points: [{x:-100, y: -260}, {x:-200, y: -260}, {x:-200, y: -360}, {x: 100, y: -360}, {x: 100, y: -260}, {x:   0, y: -260}]},
    {bottom:  10, top: 80, floorColor: "#00f", ceilingColor: "#0ff", points: [{x:-200, y: -260}, {x:-100, y: -260}, {x:-100, y: -100}, {x:-100, y:  100}, {x:-200, y:  100}]}
];
sectors[0].points[1].portal = {sector:1, line:2};
sectors[0].points[5].portal = {sector:6, line:2};
sectors[1].points[0].portal = {sector:2, line:2};
sectors[1].points[2].portal = {sector:0, line:1};
sectors[2].points[0].portal = {sector:3, line:2};
sectors[2].points[2].portal = {sector:1, line:0};
sectors[3].points[0].portal = {sector:4, line:2};
sectors[3].points[2].portal = {sector:2, line:0};
sectors[4].points[0].portal = {sector:5, line:4};
sectors[4].points[2].portal = {sector:3, line:0};
sectors[5].points[0].portal = {sector:6, line:0};
sectors[5].points[4].portal = {sector:4, line:0};
sectors[6].points[0].portal = {sector:5, line:0};
sectors[6].points[2].portal = {sector:0, line:5};

function completeSectors() {
    for (var sectorId = 0; sectorId < sectors.length; sectorId++) {
        var sector = sectors[sectorId];

        if (!sector.floorColor) sector.floorColor = "#f00";
        if (!sector.ceilingColor) sector.ceilingColor = "#0ff";

        for (var line = 0; line < sector.points.length; line++) {
            var a = sector.points[line];
            var b = sector.points[(line+1) % sector.points.length];
            a.portal = null;

            for (var otherSectorId = 0; otherSectorId < sectors.length; otherSectorId++) {
                if (otherSectorId == sectorId) continue;
                var otherSector = sectors[otherSectorId];

                for (var otherLine = 0; otherLine < otherSector.points.length; otherLine++) {
                    var otherA = otherSector.points[otherLine];
                    var otherB = otherSector.points[(otherLine+1) % otherSector.points.length];

                    var matchAA = a.x == otherA.x && a.y == otherA.y;
                    var matchBB = b.x == otherB.x && b.y == otherB.y;
                    var matchAB = a.x == otherB.x && a.y == otherB.y;
                    var matchBA = b.x == otherA.x && b.y == otherA.y;

                    if ((matchAA && matchBB) || (matchAB && matchBA)) {
                        a.portal = {sector: otherSectorId, line: otherLine};
                        if (!sector.bottom) sector.bottom = otherSector.bottom;
                        if (!sector.top) sector.top = otherSector.top;
                    }
                }
            }
        }
    }
}

function updatePlayer() {
    // player controls:
    var direction = mat4MulVec3(mat4Rotation(rads(player.angle)), {x:0, y:-1, z:0})

    var playerOldPos = { x: player.x, y: player.y };
    var moved = false;

    if (keyUp) { player.x += direction.x * 5; player.y += direction.y * 5; moved = true; }
    if (keyDown) { player.x -= direction.x * 5; player.y -= direction.y * 5; moved = true; }
    if (keyLeft) player.angle -= 5;
    if (keyRight) player.angle += 5;

    if (moved) {
        var curSector = sectors[player.sector];

        for (var line = 0; line < curSector.points.length; line++) {
            var p2 = curSector.points[line];
            var p3 = curSector.points[(line+1) % curSector.points.length];

            if (linesIntersect(playerOldPos, player, p2, p3)) {
                var linePortal = curSector.points[line].portal;
                if (linePortal) {
                    player.sector = linePortal.sector;
                    player.z = sectors[player.sector].bottom + 20;
                } else {
                    player.x = playerOldPos.x;
                    player.y = playerOldPos.y;
                }
            }
        }
    }
}

function drawSector3d(sectorId, previousSectorId, renderState, clipMin, clipMax) {
    var ctx = renderState.context;
    //var ctx2 = renderState.context;
    var viewMatrix = renderState.viewMatrix;
    var nearClip = renderState.nearClip;
    var projection = renderState.projection;
    var halfWidth = renderState.context.canvas.width / 2;
    var halfHeight = renderState.context.canvas.height / 2;

    ctx.save();
    ctx.strokeStyle = "#000";

    ctx.beginPath();
    ctx.moveTo(clipMin, 0);
    ctx.lineTo(clipMax, 0);
    ctx.lineTo(clipMax, ctx.canvas.height);
    ctx.lineTo(clipMin, ctx.canvas.height);
    ctx.closePath();
    ctx.clip();

    var sector = sectors[sectorId];
    for (var line = 0; line < sector.points.length; line++) {
        var portal = sector.points[line].portal;
        var a = mat4MulVec2(viewMatrix, sector.points[line]);
        var b = mat4MulVec2(viewMatrix, sector.points[(line+1) % sector.points.length]);

        if (a.y > -nearClip && b.y > -nearClip) continue;

        if (a.y > -nearClip) {
            var lx = b.x - a.x; var ly = b.y - a.y;
            var intersectX = a.x + (lx * (-(a.y + nearClip) / ly));

            a = { x: intersectX, y: -nearClip };
        }

        if (b.y > -nearClip) {
            var lx = b.x - a.x; var ly = b.y - a.y;
            var intersectX = a.x + (lx * (-(a.y + nearClip) / ly));

            b = { x: intersectX, y: -nearClip };
        }

        var vecs = [
            {x: a.x, y: -sector.bottom + player.z, z: a.y},
            {x: b.x, y: -sector.bottom + player.z, z: b.y},
            {x: b.x, y: -sector.top    + player.z, z: b.y},
            {x: a.x, y: -sector.top    + player.z, z: a.y}
        ];
        if (portal) {
            var otherSector = sectors[portal.sector];

            vecs.push({x: a.x, y: -otherSector.bottom + player.z, z: a.y});
            vecs.push({x: b.x, y: -otherSector.bottom + player.z, z: b.y});
            vecs.push({x: b.x, y: -otherSector.top    + player.z, z: b.y});
            vecs.push({x: a.x, y: -otherSector.top    + player.z, z: a.y});
        }

        for (var i = 0; i<vecs.length; i++) {
            vecs[i] = mat4MulVec3(projection, vecs[i]);
            vecs[i] = vec3DivS(vecs[i], vecs[i].w);
            vecs[i] = { x: halfWidth + vecs[i].x * halfWidth, y: halfHeight + vecs[i].y * halfHeight, z: vecs[i].z };
        }

        if (vecs[0].x < clipMin && vecs[1].x < clipMin) continue;
        if (vecs[0].x > clipMax && vecs[1].x > clipMax) continue;

        if (vecs[0].x > vecs[1].x)
            continue;

        if (portal) {
            if (portal.sector != previousSectorId) {
                var subClipMin = Math.min(vecs[0].x, vecs[1].x);
                var subClipMax = Math.max(vecs[0].x, vecs[1].x);

                drawSector3d(portal.sector, sectorId, renderState, subClipMin, subClipMax);
            }
        }

        //floor
        ctx.fillStyle = sector.floorColor;
        ctx.beginPath();
        ctx.moveTo(vecs[0].x, vecs[0].y);
        ctx.lineTo(vecs[1].x, vecs[1].y);
        ctx.lineTo(vecs[1].x, ctx.canvas.height);
        ctx.lineTo(vecs[0].x, ctx.canvas.height);
        ctx.closePath();
        ctx.fill();

        //ceiling
        ctx.fillStyle = sector.ceilingColor;
        ctx.beginPath();
        ctx.moveTo(vecs[2].x, vecs[2].y);
        ctx.lineTo(vecs[3].x, vecs[3].y);
        ctx.lineTo(vecs[3].x, 0);
        ctx.lineTo(vecs[2].x, 0);
        ctx.closePath();
        ctx.fill();

        if (!portal) {
            ctx.fillStyle = "#ccc";
            ctx.beginPath();
            ctx.moveTo(vecs[0].x, vecs[0].y);
            ctx.lineTo(vecs[1].x, vecs[1].y);
            ctx.lineTo(vecs[2].x, vecs[2].y);
            ctx.lineTo(vecs[3].x, vecs[3].y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            var otherSector = sectors[portal.sector];

            // bottom
            if (otherSector.bottom > sector.bottom) {
                ctx.fillStyle = "#ccc";
                ctx.beginPath();
                ctx.moveTo(vecs[0].x, vecs[0].y);
                ctx.lineTo(vecs[1].x, vecs[1].y);
                ctx.lineTo(vecs[5].x, vecs[5].y);
                ctx.lineTo(vecs[4].x, vecs[4].y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (otherSector.bottom < sector.bottom){
                ctx.beginPath();
                ctx.moveTo(vecs[0].x, vecs[0].y);
                ctx.lineTo(vecs[1].x, vecs[1].y);
                ctx.stroke();
            }

            // top
            if (otherSector.top < sector.top) {
                ctx.fillStyle = "#ccc";
                ctx.beginPath();
                ctx.moveTo(vecs[2].x, vecs[2].y);
                ctx.lineTo(vecs[3].x, vecs[3].y);
                ctx.lineTo(vecs[7].x, vecs[7].y);
                ctx.lineTo(vecs[6].x, vecs[6].y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (otherSector.top > sector.top) {
                ctx.beginPath();
                ctx.moveTo(vecs[2].x, vecs[2].y);
                ctx.lineTo(vecs[3].x, vecs[3].y);
                ctx.stroke();
            }
        }
    }

    ctx.restore();
}

function drawMap(renderState) {
    var viewMatrix = renderState.viewMatrix;
    var ctx = renderState.context;
    var halfWidth = renderState.context.canvas.width / 2;
    var halfHeight = renderState.context.canvas.height / 2;
    var fillSectors = renderState.fillSectors;

    // draw sectors
    for (var curSector = 0; curSector < sectors.length; curSector++) {
        var sector = sectors[curSector];

        if (fillSectors) {
            ctx.fillStyle = sector.floorColor;
            ctx.beginPath();
            var pos = mat4MulVec2(viewMatrix, sector.points[0]);
            ctx.moveTo(halfWidth + pos.x, halfHeight + pos.y);
            for (var line = 1; line < sector.points.length; line++) {
                pos = mat4MulVec2(viewMatrix, sector.points[line]);
                ctx.lineTo(halfWidth + pos.x, halfHeight + pos.y);
            }
            ctx.closePath();
            ctx.fill();
        }


        for (var line = 0; line < sector.points.length; line++) {
            var a = mat4MulVec2(viewMatrix, sector.points[line]);
            var b = mat4MulVec2(viewMatrix, sector.points[(line+1) % sector.points.length]);

            ctx.strokeStyle = sector.points[line].portal ? "#f00" : "#000";
            ctx.beginPath();
            ctx.moveTo(halfWidth + a.x, halfHeight + a.y);
            ctx.lineTo(halfWidth + b.x, halfHeight + b.y);
            ctx.stroke();
        }
    }

    // draw player
    ctx.beginPath();
    ctx.moveTo(halfWidth, halfHeight);
    ctx.lineTo(halfWidth, halfHeight - 15);
    ctx.stroke();
}

function keyChanged(event, pressed) {
    if (event.keyCode == 37) { keyLeft = pressed; }
    if (event.keyCode == 38) { keyUp = pressed; }
    if (event.keyCode == 39) { keyRight = pressed; }
    if (event.keyCode == 40) { keyDown = pressed; }
    if (event.keyCode == 16) { shiftDown = pressed; }
    if (event.keyCode == 77) { mapShown = pressed; }
}
document.addEventListener('keydown', function(event) { keyChanged(event, true); });
document.addEventListener('keyup', function(event) { keyChanged(event, false); });
