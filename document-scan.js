(() => {
  'use strict';

  const MAX_FILE_BYTES = 25 * 1024 * 1024;
  const MAX_EXTRACTED_CHARACTERS = 750000;
  const MAX_OCR_PAGES = 30;
  const MAX_OCR_RENDER_PIXELS = 4_000_000;
  const SUPPORTED_EXTENSIONS = new Set(['pdf', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'webp']);
  const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
  const TESSERACT_SCRIPT = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
  const TESSERACT_WORKER = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js';
  const TESSERACT_CORE = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.1.2';
  const TESSERACT_LANGUAGE = 'https://tessdata.projectnaptha.com/4.0.0_fast';

  const fileInput = document.getElementById('documentFileInput');
  const chooseButton = document.getElementById('chooseDocumentBtn');
  const cameraInput = document.getElementById('cameraFileInput');
  const takePhotoButton = document.getElementById('takePhotoBtn');
  const uploadPanel = document.getElementById('documentUploadPanel');
  const fileNameBox = document.getElementById('documentFileName');
  const statusBox = document.getElementById('documentStatus');
  const textInput = document.getElementById('textInput');
  const clearButton = document.getElementById('clearBtn');

  if (!fileInput || !chooseButton || !uploadPanel || !fileNameBox || !statusBox || !textInput) return;

  let tesseractLoadPromise = null;
  let pdfLoadPromise = null;
  let mammothLoadPromise = null;

  function extensionFor(fileName) {
    const name = String(fileName || '');
    const dot = name.lastIndexOf('.');
    return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function wordCount(text) {
    const matches = String(text || '').trim().match(/\S+/g);
    return matches ? matches.length : 0;
  }

  function setStatus(message, state = '') {
    statusBox.textContent = message;
    statusBox.classList.remove('is-loading', 'is-success', 'is-error');
    if (state) statusBox.classList.add(`is-${state}`);
  }

  function resetDocumentState() {
    fileInput.value = '';
    if (cameraInput) cameraInput.value = '';
    fileNameBox.textContent = 'No file selected';
    delete textInput.dataset.documentName;
    delete textInput.dataset.documentType;
    setStatus('');
    uploadPanel.classList.remove('has-file', 'is-dragging');
  }

  function cleanExtractedText(text) {
    return String(text || '')
      .replace(/\u0000/g, '')
      .replace(/\r\n?/g, '\n')
      .replace(/[\t\f\v]+/g, ' ')
      .replace(/[ \u00a0]+\n/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
  }

  function ensureTextWithinLimit(text) {
    if (text.length > MAX_EXTRACTED_CHARACTERS) {
      throw new Error(`This document contains more than ${MAX_EXTRACTED_CHARACTERS.toLocaleString()} extracted characters. Split it into smaller documents before scanning.`);
    }
  }

  function joinLocatedParts(parts) {
    const textParts = [];
    const segments = [];
    let offset = 0;
    parts.forEach((part, index) => {
      const text = cleanExtractedText(part && part.text);
      if (!text) return;
      if (textParts.length) offset += 2;
      const start = offset;
      textParts.push(text);
      offset += text.length;
      segments.push({
        label: String(part.label || `Part ${index + 1}`),
        detail: String(part.detail || ''),
        url: '',
        start,
        end: offset,
        page: part.page || null
      });
    });
    return { text: textParts.join('\n\n'), segments };
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-detector-src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === 'true') resolve();
        else {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', () => reject(new Error('The OCR engine could not be loaded. Check the internet connection and try again.')), { once: true });
        }
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.detectorSrc = src;
      script.addEventListener('load', () => { script.dataset.loaded = 'true'; resolve(); }, { once: true });
      script.addEventListener('error', () => reject(new Error('The OCR engine could not be loaded. Check the internet connection and try again.')), { once: true });
      document.head.appendChild(script);
    });
  }

async function ensurePdfReader() {
  if (window.pdfjsLib && typeof window.pdfjsLib.getDocument === 'function') return window.pdfjsLib;
  if (!pdfLoadPromise) pdfLoadPromise = loadScript('vendor/pdfjs-bundle.min.js?v=6.1.200');
  await pdfLoadPromise;
  if (!window.pdfjsLib || typeof window.pdfjsLib.getDocument !== 'function') {
    throw new Error('The PDF reader loaded incorrectly. Reload the page and try again.');
  }
  return window.pdfjsLib;
}

async function ensureMammothReader() {
  if (window.mammoth && typeof window.mammoth.extractRawText === 'function') return window.mammoth;
  if (!mammothLoadPromise) mammothLoadPromise = loadScript('vendor/mammoth.browser.min.js?v=1.12.0');
  await mammothLoadPromise;
  if (!window.mammoth || typeof window.mammoth.extractRawText !== 'function') {
    throw new Error('The DOCX reader loaded incorrectly. Reload the page and try again.');
  }
  return window.mammoth;
}

  async function ensureTesseract() {
    if (window.Tesseract && typeof window.Tesseract.createWorker === 'function') return window.Tesseract;
    if (!tesseractLoadPromise) tesseractLoadPromise = loadScript(TESSERACT_SCRIPT);
    await tesseractLoadPromise;
    if (!window.Tesseract || typeof window.Tesseract.createWorker !== 'function') {
      throw new Error('The OCR engine loaded incorrectly. Reload the page and try again.');
    }
    return window.Tesseract;
  }

  async function createOcrWorker(progressLabel) {
    const Tesseract = await ensureTesseract();
    return Tesseract.createWorker('eng', 1, {
      workerPath: TESSERACT_WORKER,
      corePath: TESSERACT_CORE,
      langPath: TESSERACT_LANGUAGE,
      logger(message) {
        if (!message || !Number.isFinite(message.progress)) return;
        const percent = Math.max(0, Math.min(100, Math.round(message.progress * 100)));
        const activity = String(message.status || 'Recognizing text').replace(/^./, char => char.toUpperCase());
        setStatus(`${progressLabel}: ${activity} · ${percent}%`, 'loading');
      }
    });
  }

  async function recognizeWithWorker(worker, image, label) {
    setStatus(`${label}: preparing OCR…`, 'loading');
    const result = await worker.recognize(image);
    return cleanExtractedText(result && result.data && result.data.text);
  }

  function ocrViewport(page) {
    const base = page.getViewport({ scale: 2 });
    const pixels = base.width * base.height;
    if (pixels <= MAX_OCR_RENDER_PIXELS) return base;
    const ratio = Math.sqrt(MAX_OCR_RENDER_PIXELS / pixels);
    return page.getViewport({ scale: Math.max(0.8, 2 * ratio) });
  }

  async function renderPdfPage(page) {
    const viewport = ocrViewport(page);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(viewport.width));
    canvas.height = Math.max(1, Math.ceil(viewport.height));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('This browser could not prepare the PDF page for OCR.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas;
  }

  async function extractPdf(file) {
    await ensurePdfReader();

    if (window.pdfjsLib.GlobalWorkerOptions) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs-bundle.min.js';
    }

    const data = new Uint8Array(await file.arrayBuffer());
    const loadingTask = window.pdfjsLib.getDocument({ data, isEvalSupported: false, useSystemFonts: true });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const parts = [];
    let worker = null;
    let ocrPages = 0;

    try {
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        setStatus(`Reading PDF page ${pageNumber} of ${pageCount}…`, 'loading');
        const page = await pdf.getPage(pageNumber);
        try {
          const content = await page.getTextContent({ includeMarkedContent: false });
          let pageText = '';
          for (const item of content.items || []) {
            if (!item || typeof item.str !== 'string') continue;
            pageText += item.str;
            pageText += item.hasEOL ? '\n' : ' ';
          }
          pageText = cleanExtractedText(pageText);

          if (pageText.length < 20) {
            if (ocrPages >= MAX_OCR_PAGES) {
              throw new Error(`OCR is limited to ${MAX_OCR_PAGES} scanned PDF pages at a time. Split this PDF into smaller files.`);
            }
            if (!worker) worker = await createOcrWorker(`PDF page ${pageNumber} of ${pageCount}`);
            const canvas = await renderPdfPage(page);
            pageText = await recognizeWithWorker(worker, canvas, `PDF page ${pageNumber} of ${pageCount}`);
            canvas.width = 1;
            canvas.height = 1;
            ocrPages += 1;
          }

          if (pageText) parts.push({ text: pageText, label: `Page ${pageNumber}`, page: pageNumber });
        } finally {
          if (typeof page.cleanup === 'function') page.cleanup();
        }
      }
    } finally {
      if (worker) await worker.terminate();
      if (typeof pdf.cleanup === 'function') pdf.cleanup();
      if (typeof pdf.destroy === 'function') await pdf.destroy();
    }

    const joined = joinLocatedParts(parts);
    if (!joined.text) throw new Error('No readable text was found in this PDF, including OCR.');
    return {
      ...joined,
      detail: `${pageCount} ${pageCount === 1 ? 'page' : 'pages'}${ocrPages ? ` · OCR used on ${ocrPages}` : ''}`,
      locationMode: 'page'
    };
  }

  async function extractDocx(file) {
    await ensureMammothReader();
    setStatus('Reading DOCX text…', 'loading');
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    const text = cleanExtractedText(result && result.value);
    if (!text) throw new Error('No readable text was found in this DOCX file.');
    return { text, segments: [], detail: 'DOCX', locationMode: 'paragraph' };
  }

  async function extractTxt(file) {
    setStatus('Reading text file…', 'loading');
    const text = cleanExtractedText(await file.text());
    if (!text) throw new Error('No readable text was found in this TXT file.');
    return { text, segments: [], detail: 'TXT', locationMode: 'line' };
  }

  async function extractImage(file) {
    const worker = await createOcrWorker('Image OCR');
    try {
      const text = await recognizeWithWorker(worker, file, 'Image OCR');
      if (!text) throw new Error('OCR found no readable English text in this image.');
      return {
        text,
        segments: [{ label: 'Image', detail: file.name, url: '', start: 0, end: text.length }],
        detail: 'Image OCR',
        locationMode: 'image'
      };
    } finally {
      await worker.terminate();
    }
  }

  async function extractFile(file) {
    if (!file) return null;
    const extension = extensionFor(file.name);
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      throw new Error('Choose a PDF, DOCX, TXT, JPG, PNG, or WebP file.');
    }
    if (file.size <= 0) throw new Error('The selected file is empty.');
    if (file.size > MAX_FILE_BYTES) throw new Error(`The file is ${formatFileSize(file.size)}. The current limit is 25 MB.`);

    if (extension === 'pdf') return extractPdf(file);
    if (extension === 'docx') return extractDocx(file);
    if (extension === 'txt') return extractTxt(file);
    if (IMAGE_EXTENSIONS.has(extension)) return extractImage(file);
    throw new Error('That file type is not supported.');
  }

  async function loadDocument(file) {
    fileNameBox.textContent = file ? `${file.name} · ${formatFileSize(file.size)}` : 'No file selected';
    uploadPanel.classList.toggle('has-file', Boolean(file));
    if (!file) return;

    chooseButton.disabled = true;
    if (takePhotoButton) takePhotoButton.disabled = true;
    setStatus('Preparing document…', 'loading');

    try {
      const extracted = await extractFile(file);
      ensureTextWithinLimit(extracted.text);
      textInput.value = extracted.text;
      textInput.dataset.documentName = file.name;
      textInput.dataset.documentType = extensionFor(file.name).toUpperCase();
      if (typeof window.detectorSetSourceContext === 'function') {
        window.detectorSetSourceContext({
          type: 'document',
          label: file.name,
          detail: extracted.detail,
          locationMode: extracted.locationMode,
          segments: extracted.segments || []
        });
      }
      const words = wordCount(extracted.text);
      setStatus(`Loaded ${extracted.detail} · ${words.toLocaleString()} ${words === 1 ? 'word' : 'words'}. Select Analyze to scan the document.`, 'success');
      textInput.dispatchEvent(new Event('input', { bubbles: true }));
      document.dispatchEvent(new CustomEvent('detector:source-loaded', { detail: { source: 'document' } }));
    } catch (error) {
      fileInput.value = '';
      if (cameraInput) cameraInput.value = '';
      uploadPanel.classList.remove('has-file');
      fileNameBox.textContent = 'No file selected';
      setStatus(error && error.message ? error.message : 'The document could not be read.', 'error');
    } finally {
      chooseButton.disabled = false;
      if (takePhotoButton) takePhotoButton.disabled = false;
    }
  }

  chooseButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => loadDocument(fileInput.files && fileInput.files[0]));
  if (takePhotoButton && cameraInput) {
    takePhotoButton.addEventListener('click', () => cameraInput.click());
    cameraInput.addEventListener('change', () => loadDocument(cameraInput.files && cameraInput.files[0]));
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    uploadPanel.addEventListener(eventName, event => {
      event.preventDefault();
      event.stopPropagation();
      uploadPanel.classList.add('is-dragging');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadPanel.addEventListener(eventName, event => {
      event.preventDefault();
      event.stopPropagation();
      uploadPanel.classList.remove('is-dragging');
    });
  });

  uploadPanel.addEventListener('drop', event => {
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) loadDocument(file);
  });

  document.addEventListener('detector:source-loaded', event => {
    if (!event.detail || event.detail.source !== 'document') resetDocumentState();
  });

  textInput.addEventListener('input', event => {
    if (event.isTrusted && textInput.dataset.documentName) resetDocumentState();
  });

  if (clearButton) clearButton.addEventListener('click', () => {
    resetDocumentState();
    if (typeof window.detectorClearSourceContext === 'function') window.detectorClearSourceContext();
  });
})();
