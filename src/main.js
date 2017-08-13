var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var canvas2 = document.getElementById("canvas2");
var ctx2 = canvas2.getContext("2d");

function mainLoop() {
    updatePlayer();

    for (var sectorId = 0; sectorId < sectors.length; sectorId++) {
        var sector = sectors[sectorId];
        if (sector.active) {

            if (sector.target > sector.bottom) { sector.bottom += 1; }
            else if (sector.target < sector.bottom) { sector.bottom -= 1; }
            else { sector.active = false; }

            if (player.sector == sectorId) {
                player.z = sector.bottom + 20;
            }
        }
    }

    var viewMatrix = mat4MulMat4(mat4Rotation(rads(-player.angle)),
                                 mat4Translation({x: -player.x, y: -player.y, z: 0}));

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx2.clearRect(0, 0, ctx2.canvas.width, ctx2.canvas.height);

    drawMap({context: ctx, viewMatrix: viewMatrix, fillSectors: false});


    var nearClip = 5.0;
    var ratio = ctx2.canvas.width / ctx.canvas.height;

    var renderState = {
        context: ctx2,
        viewMatrix: viewMatrix,
        nearClip: nearClip,
        projection: mat4Projection(rads(15), ratio, nearClip, 500.0),
    };

    drawSector3d(player.sector, -1, renderState, 0, ctx2.canvas.width);

    if (mapShown)
        drawMap({context: ctx2, viewMatrix: viewMatrix, fillSectors: false});
}

document.addEventListener('keydown', function(event) {
    switch (event.keyCode) {
        case 83 /* s */: saveMap(); break;
        case 76 /* l */: loadMap(); break;
        case 32 /* space */:
            var sector = sectors[player.sector];

            for (line = 0; line < sector.points.length; line++) {
                var a = sector.points[line];

                if (a.portal) {
                    var otherSector = sectors[a.portal.sector];
                    if (otherSector.bottom != sector.bottom) {
                        sector.target = otherSector.bottom;
                        sector.active = true;
                        break;
                    }
                }
            }

            break;
    }
});

completeSectors();
window.setInterval(mainLoop, 1000/30);
