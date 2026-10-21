import { storage } from '../state/storage';
import { generateQuestions } from '../api/generate.api';
import { aiRefusalMessage } from '../features/ai-budget';
import { setQuestions } from '../features/questions';
import { renderClassCards } from './class-selector';
import { t } from '../features/i18n';
import { setupDialog, closeDialog } from './dialog';

let uploadedImageBase64: string | null = null;
let uploadedImageMimeType: string | null = null;

export function setupSetupPanel(): void {
  const panel = document.getElementById('setup-panel');
  if (!panel) return;
  // Opened from the "Dodaj klase" card (ui/class-selector.ts). Close button,
  // backdrop, Esc and focus trap: ui/dialog.ts.
  setupDialog(panel, document.getElementById('setup-panel-close'));
}

export function setupImageUpload(): void {
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('image-upload') as HTMLInputElement | null;

  if (!uploadArea || !fileInput) return;

  uploadArea.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).classList.contains('upload-remove')) return;
    fileInput.click();
  });
  // The drop zone is role="button": make it keyboard operable too.
  uploadArea.addEventListener('keydown', (e) => {
    if (e.target !== uploadArea) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleImageFile(fileInput.files[0], uploadArea);
    }
  });

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer?.files.length) {
      handleImageFile(e.dataTransfer.files[0], uploadArea);
    }
  });
}

function handleImageFile(file: File, uploadArea: HTMLElement): void {
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    alert(t('upload.formats', 'Dozwolone formaty: JPG, PNG'));
    return;
  }
  if (file.size > 4 * 1024 * 1024) {
    alert(t('upload.maxSize', 'Maksymalny rozmiar pliku: 4MB'));
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target!.result as string;
    uploadedImageBase64 = dataUrl.split(',')[1];
    uploadedImageMimeType = file.type;
    showImagePreview(uploadArea, dataUrl);
  };
  reader.readAsDataURL(file);
}

function showImagePreview(uploadArea: HTMLElement, dataUrl: string): void {
  uploadArea.classList.add('has-image');
  uploadArea.innerHTML = `
    <button type="button" class="upload-remove" title="${t('upload.remove', 'Usun zdjecie')}" aria-label="${t('upload.remove', 'Usun zdjecie')}">&times;</button>
    <img src="${dataUrl}" class="upload-preview" alt="${t('upload.previewAlt', 'Podglad')}">
  `;
  uploadArea.querySelector('.upload-remove')!.addEventListener('click', (e) => {
    e.stopPropagation();
    clearImage(uploadArea);
  });
}

function clearImage(uploadArea: HTMLElement): void {
  uploadedImageBase64 = null;
  uploadedImageMimeType = null;
  uploadArea.classList.remove('has-image');
  uploadArea.innerHTML = `
    <div class="upload-icon" aria-hidden="true">&#128247;</div>
    <div class="upload-text">${t('upload.text', 'Kliknij lub przeciagnij zdjecie')}</div>
    <div class="upload-hint">${t('upload.hint', 'Max 4MB - JPG, PNG')}</div>
  `;
}

export function setupGenerateButton(onGenerated?: () => void): void {
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement | null;
  const statusEl = document.getElementById('generate-status');
  const loadingOverlay = document.getElementById('loading-overlay');

  if (!generateBtn) return;

  generateBtn.addEventListener('click', async () => {
    const classNameInput = document.getElementById('class-name-input') as HTMLInputElement;
    const contextInput = document.getElementById('class-context-input') as HTMLTextAreaElement;
    const className = classNameInput.value.trim();
    const context = contextInput.value.trim();

    if (!className) {
      if (statusEl) { statusEl.textContent = t('setup.enterName', 'Wprowadz nazwe przedmiotu / klasy'); statusEl.className = 'generate-status error'; }
      return;
    }

    generateBtn.disabled = true;
    if (loadingOverlay) loadingOverlay.classList.add('active');
    if (statusEl) { statusEl.textContent = ''; statusEl.className = 'generate-status'; }

    try {
      const newId = 'class_' + Date.now();
      const data = await generateQuestions({
        className,
        context: context || undefined,
        imageBase64: uploadedImageBase64 || undefined,
        mimeType: uploadedImageMimeType || undefined,
        classId: newId,
      });

      const questions = data.questions;

      storage.setClassQuestions(newId, questions);
      storage.addClass({
        id: newId,
        name: className,
        context,
        isDefault: false,
        questionCount: questions.length,
        generatedAt: new Date().toISOString(),
      });
      storage.setActiveClass(newId);
      setQuestions(questions);
      storage.setClassIncorrect(newId, []);

      renderClassCards(onGenerated);

      const panel = document.getElementById('setup-panel');
      if (panel) closeDialog(panel);
      classNameInput.value = '';
      contextInput.value = '';

      const uploadArea = document.getElementById('upload-area');
      if (uploadArea) clearImage(uploadArea);

      if (statusEl) { statusEl.textContent = t('setup.generatedN', 'Wygenerowano {n} pytan!', { n: questions.length }); statusEl.className = 'generate-status success'; }
      onGenerated?.();

    } catch (err: any) {
      if (statusEl) { statusEl.textContent = aiRefusalMessage(err) ?? err.message; statusEl.className = 'generate-status error'; }
    } finally {
      generateBtn.disabled = false;
      if (loadingOverlay) loadingOverlay.classList.remove('active');
    }
  });
}
