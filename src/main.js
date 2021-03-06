var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var minimapMode = 0;

function mainLoop() {
    updatePlayer();
    updateSectors();

    var viewMatrix = mat4MulMat4(mat4Rotation(rads(-player.angle)),
                                 mat4Translation({x: -player.x, y: -player.y, z: 0}));

    if (minimapMode == 2)
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    var nearClip = 1;
    var ratio = ctx.canvas.width / ctx.canvas.height;

    var renderState = {
        context: ctx,
        viewMatrix: viewMatrix,
        nearClip: nearClip,
        projection: mat4Projection(rads(70), ratio, nearClip, 500.0),
    };

    if (minimapMode == 0 || minimapMode == 1)
        drawSector3d(player.sector, -1, renderState, 0, ctx.canvas.width);

    if (minimapMode == 1 || minimapMode == 2)
        drawMap({context: ctx, viewMatrix: viewMatrix, fillSectors: minimapMode == 2});
}

document.addEventListener('keydown', function(event) {
    switch (event.keyCode) {
        case 9 /* tab */: event.preventDefault(); minimapMode = (minimapMode + 1) % 3; break;
        case 83 /* s */: saveMap(); break;
        case 76 /* l */: loadMap(); break;
        case 32 /* space */: activateSector(player.sector); break;
    }
});

//completeSectors();
window.setInterval(mainLoop, 1000/30);
