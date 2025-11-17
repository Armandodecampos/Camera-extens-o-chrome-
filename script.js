window.addEventListener("load", function () {
    document.getElementById("loader").style.display = "none";
});

let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let stream = null;
let cameraActive = false;

async function startCamera() {
    try {
        const constraints = {
            video: {
                facingMode: { exact: 'environment' },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            cameraActive = true;
        };
    } catch (error) {
        console.error('Erro ao acessar a câmera:', error);
        cameraActive = false;

        try {
            const backupConstraints = {
                video: true,
            };
            stream = await navigator.mediaDevices.getUserMedia(backupConstraints);
            video.srcObject = stream;

            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                cameraActive = true;
            };
        } catch (backupError) {
            console.error('Erro ao acessar a câmera padrão:', backupError);
            cameraActive = false;
        }
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        cameraActive = false;
    }
}

async function takePhoto() {
    let shutter = document.getElementById("shutterOverlay");
    shutter.style.opacity = "1";
    shutter.style.animation = "shutterEffect 0.3s ease-in-out";

    setTimeout(async () => {
        try {
            if ('ImageCapture' in window && stream) {
                const track = stream.getVideoTracks()[0];
                const imageCapture = new ImageCapture(track);
                const blob = await imageCapture.takePhoto();
                const imageUrl = URL.createObjectURL(blob);

                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    context.drawImage(img, 0, 0);

                    processCanvas();
                };
                img.src = imageUrl;
            } else {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                processCanvas();
            }
        } catch (error) {
            console.error('Erro ao tirar foto:', error);
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            processCanvas();
        }
    }, 300);
}

function processCanvas() {
    canvas.style.display = "block";
    video.style.display = "none";
    document.getElementById("captureButton").style.display = "none";
    document.getElementById("downloadButton").style.display = "inline-block";
    document.getElementById("newPhotoButton").style.display = "inline-block";
    document.getElementById("shutterOverlay").style.opacity = "0";
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
    link.click();

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
    document.getElementById('captureButton').style.display = 'inline-block';
}

document.getElementById('newPhotoButton').addEventListener('click', newPhoto);
document.getElementById('captureButton').addEventListener('click', takePhoto);
document.getElementById('downloadButton').addEventListener('click', downloadPhoto);

window.onload = function () {
    document.getElementById('downloadButton').style.display = 'none';
    document.getElementById('newPhotoButton').style.display = 'none';
    startCamera();
};
