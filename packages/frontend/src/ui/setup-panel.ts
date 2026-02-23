import { storage } from '../state/storage';
import { generateQuestions } from '../api/generate.api';
import { setQuestions } from '../features/questions';
import { renderClassCards } from './class-selector';

let uploadedImageBase64: string | null = null;
let uploadedImageMimeType: string | null = null;

export function setupSetupPanel(): void {
  const toggleBtn = document.getElementById('setup-toggle');
  const panel = document.getElementById('setup-panel');
  const closeBtn = document.getElementById('setup-panel-close');

  if (!toggleBtn || !panel) return;

  const registry = storage.getClassesRegistry() || [];
  if (registry.some(c => !c.isDefault)) {
    toggleBtn.classList.add('has-questions');
  }

  toggleBtn.addEventListener('click', () => panel.classList.toggle('active'));

  closeBtn?.addEventListener('click', () => panel.classList.remove('active'));

  document.addEventListener('click', (e) => {
    if (panel.classList.contains('active') && !panel.contains(e.target as Node) && e.target !== toggleBtn) {
      panel.classList.remove('active');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('active')) {
      panel.classList.remove('active');
    }
  });
}

export function setupImageUpload(): void {
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('image-upload') as HTMLInputElement | null;

  if (!uploadArea || !fileInput) return;

  uploadArea.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).classList.contains('upload-remove')) return;
    fileInput.click();
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
    alert('Dozwolone formaty: JPG, PNG');
    return;
  }
  if (file.size > 4 * 1024 * 1024) {
    alert('Maksymalny rozmiar pliku: 4MB');
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
    <button class="upload-remove" title="Usun zdjecie">&times;</button>
    <img src="${dataUrl}" class="upload-preview" alt="Podglad">
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
    <div class="upload-icon">&#128247;</div>
    <div class="upload-text">Kliknij lub przeciagnij zdjecie</div>
    <div class="upload-hint">Max 4MB - JPG, PNG</div>
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
      if (statusEl) { statusEl.textContent = 'Wprowadz nazwe przedmiotu / klasy'; statusEl.className = 'generate-status error'; }
      return;
    }

    generateBtn.disabled = true;
    if (loadingOverlay) loadingOverlay.classList.add('active');
    if (statusEl) { statusEl.textContent = ''; statusEl.className = 'generate-status'; }

    try {
      const data = await generateQuestions({
        className,
        context: context || undefined,
        imageBase64: uploadedImageBase64 || undefined,
        mimeType: uploadedImageMimeType || undefined,
      });

      const questions = data.questions;
      const newId = 'class_' + Date.now();

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
      if (panel) panel.classList.remove('active');
      classNameInput.value = '';
      contextInput.value = '';

      const uploadArea = document.getElementById('upload-area');
      if (uploadArea) clearImage(uploadArea);

      if (statusEl) { statusEl.textContent = `Wygenerowano ${questions.length} pytan!`; statusEl.className = 'generate-status success'; }
      onGenerated?.();

      const toggleBtn = document.getElementById('setup-toggle');
      if (toggleBtn) toggleBtn.classList.add('has-questions');
    } catch (err: any) {
      if (statusEl) { statusEl.textContent = err.message; statusEl.className = 'generate-status error'; }
    } finally {
      generateBtn.disabled = false;
      if (loadingOverlay) loadingOverlay.classList.remove('active');
    }
  });
}
