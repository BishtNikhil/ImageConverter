const MAX_FILES = 50;
let selectedFiles = [];

const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const convertButton = document.getElementById('convert-button');
const globalProgress = document.getElementById('global-progress');
const formatSelect = document.getElementById('format-select');
const qualityRange = document.getElementById('quality-range');
const qualityValue = document.getElementById('quality-value');
const fileCountDisplay = document.getElementById('count');

// Update quality value display
qualityRange.addEventListener('input', () => {
  qualityValue.textContent = qualityRange.value;
});

// Prevent default behaviors for drag-and-drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Highlight drop area on dragover
['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
});

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);

// Handle file selection via input
fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
});

// Handle browse button click
document.getElementById('browse-button').addEventListener('click', () => {
  fileInput.click();
});

// Handle convert button click
convertButton.addEventListener('click', convertAndDownload);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

function handleFiles(files) {
  const filesArray = Array.from(files);
  const totalFiles = selectedFiles.length + filesArray.length;

  if (totalFiles > MAX_FILES) {
    alert(`You can upload a maximum of ${MAX_FILES} files. You have already selected ${selectedFiles.length} files.`);
    return;
  }

  filesArray.forEach(file => {
    const fileType = file.type;
    const fileName = file.name;

    if (fileType === 'image/heic' || fileName.toLowerCase().endsWith('.heic')) {
      // Convert HEIC to JPEG
      heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
        .then(convertedBlob => {
          const convertedFile = new File([convertedBlob], fileName.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
          selectedFiles.push(convertedFile);
          previewFile(convertedFile);
          updateFileCount();
        })
        .catch(error => {
          console.error('HEIC conversion error:', error);
          alert(`Failed to convert HEIC file: ${fileName}`);
        });
    } else if (fileType.startsWith('image/')) {
      selectedFiles.push(file);
      previewFile(file);
      updateFileCount();
    } else {
      alert(`File "${fileName}" is not a supported image format.`);
    }
  });
}

function previewFile(file) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = function() {
    const previewDiv = document.createElement('div');
    previewDiv.classList.add('preview');

    const img = document.createElement('img');
    img.src = reader.result;
    img.alt = file.name;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      previewContainer.removeChild(previewDiv);
      selectedFiles = selectedFiles.filter(f => f !== file);
      updateFileCount();
    });

    const progressBar = document.createElement('progress');
    progressBar.value = 0;
    progressBar.max = 100;
    progressBar.classList.add('individual-progress');

    previewDiv.appendChild(img);
    previewDiv.appendChild(removeBtn);
    previewDiv.appendChild(progressBar);
    previewContainer.appendChild(previewDiv);
  };
}

function convertAndDownload() {
  if (selectedFiles.length === 0) {
    alert('No files selected for conversion.');
    return;
  }

  const format = formatSelect.value;
  const quality = parseInt(qualityRange.value, 10) / 100;
  const previews = previewContainer.querySelectorAll('.preview');
  let completed = 0;

  globalProgress.value = 0;

  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(event) {
      const img = new Image();
      img.src = event.target.result;
      img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        let mimeType = '';
        switch (format) {
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          default:
            mimeType = 'image/jpeg';
        }

        canvas.toBlob(function(blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${file.name.split('.').slice(0, -1).join('.')}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // Update individual progress
          const progressBar = previews[index].querySelector('.individual-progress');
          progressBar.value = 100;

          // Update global progress
          completed++;
          globalProgress.value = (completed / selectedFiles.length) * 100;
        }, mimeType, quality);
      };
    };
  });
}

function updateFileCount() {
  fileCountDisplay.textContent = selectedFiles.length;
}
