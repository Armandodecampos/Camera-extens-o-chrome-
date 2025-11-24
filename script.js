window.addEventListener("load", function () {
    document.getElementById("loader").style.display = "none";
});

let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let stream = null;
let cameraActive = false;

// Inicializa a câmera
async function startCamera() {
    try {
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 },
                focusMode: { ideal: 'continuous' },
                exposureMode: { ideal: 'auto' }
            }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;

        video.onloadedmetadata = () => {
            // Ajusta apenas a resolução do canvas interno, o visual é controlado pelo CSS
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            cameraActive = true;
        };
    } catch (error) {
        console.error('Erro ao acessar a câmera:', error);

        try {
             // Fallback
             stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
             });
             video.srcObject = stream;
        } catch (e) {
            console.error("Fallback falhou", e);
            alert("Erro ao iniciar câmera. Verifique permissões.");
        }
    }
}

// Tira a foto
async function takePhoto() {
    let shutter = document.getElementById("shutterOverlay");
    shutter.style.animation = 'none';
    shutter.offsetHeight;
    shutter.style.animation = "shutterEffect 0.3s ease-in-out";

    try {
        if ('ImageCapture' in window && stream) {
            const track = stream.getVideoTracks()[0];
            const imageCapture = new ImageCapture(track);

            try {
                const blob = await imageCapture.takePhoto();
                const imageUrl = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    cropAndDraw(img);
                    URL.revokeObjectURL(imageUrl);
                };
                img.src = imageUrl;
            } catch (e) {
                cropAndDraw(video);
            }
        } else {
            cropAndDraw(video);
        }
    } catch (error) {
        console.error('Erro ao tirar foto:', error);
        cropAndDraw(video);
    }
}

// LÓGICA DE CORTE EXATA DO ARQUIVO 2.TXT
function cropAndDraw(source) {
    let width = source.videoWidth || source.width;
    let height = source.videoHeight || source.height;

    // Proporção exata definida no arquivo 2
    let targetAspectRatio = 120 / 141;

    let newWidth, newHeight, xOffset, yOffset;

    if (width / height > targetAspectRatio) {
        newHeight = height;
        newWidth = height * targetAspectRatio;
        xOffset = (width - newWidth) / 2;
        yOffset = 0;
    } else {
        newWidth = width;
        newHeight = width / targetAspectRatio;
        xOffset = 0;
        yOffset = (height - newHeight) / 2;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;

    context.drawImage(source, xOffset, yOffset, newWidth, newHeight, 0, 0, newWidth, newHeight);

    processCanvas();
}

function processCanvas() {
    canvas.style.display = "block";
    video.style.display = "none";
    document.getElementById("captureButton").style.display = "none";
    document.getElementById("downloadButton").style.display = "flex";
    document.getElementById("newPhotoButton").style.display = "flex";
}

function generateRandomFilename() {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let filename = 'foto_';
    for (let i = 0; i < 16; i++) {
        filename += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return filename + '.png';
}

function downloadPhoto() {
    let link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = generateRandomFilename();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    document.getElementById("successIcon").style.display = "block";

    setTimeout(() => {
        document.getElementById("successIcon").style.display = "none";
        newPhoto();
    }, 1000);
}

function newPhoto() {
    canvas.style.display = 'none';
    video.style.display = 'block';
    document.getElementById('downloadButton').style.display = 'none';
    document.getElementById('newPhotoButton').style.display = 'none';
    document.getElementById('captureButton').style.display = 'flex';
}

window.addEventListener('load', function () {
    document.getElementById("loader").style.display = "none";
    startCamera();
});

document.getElementById('newPhotoButton').addEventListener('click', newPhoto);
document.getElementById('captureButton').addEventListener('click', takePhoto);
document.getElementById('downloadButton').addEventListener('click', downloadPhoto);
